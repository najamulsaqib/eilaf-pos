import { useState, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  BeakerIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import SelectField from '@components/ui/SelectField';
import { useLocale } from '@contexts/LocaleContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme, type TThemeMode } from '@contexts/ThemeContext';
import { useSettings } from '@hooks/useSettings';
import { LOCALES, Locale } from '@i18n/index';
import { updaterApi, backupApi } from '@services/db';
import ConfirmDialog from '@components/ui/ConfirmDialog';

type Tab = 'business' | 'receipt' | 'app' | 'account' | 'backup' | 'updates';

// ── Sidebar nav item ──────────────────────────────────────────────────────────

interface NavItemConfig {
  id: Tab;
  icon: ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  activeText: string;
  activeBg: string;
  activeBorder: string;
  iconBg: string;
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: NavItemConfig;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-start px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer mb-1
        ${
          active
            ? `${item.activeBg} ${item.activeBorder} border`
            : 'hover:bg-surface-raised border border-transparent'
        }
      `}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? item.iconBg : 'bg-surface-muted'}`}
      >
        <Icon
          className={`w-4 h-4 ${active ? item.activeText : 'text-ink-ghost'}`}
        />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${active ? 'text-ink' : 'text-ink-dim'}`}
        >
          {item.label}
        </p>
        <p className="text-xs text-ink-ghost truncate mt-0.5">{item.desc}</p>
      </div>
    </button>
  );
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({
  icon: Icon,
  iconBg,
  iconText,
  title,
  desc,
}: {
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="px-8 py-6 border-b border-edge-muted flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-5 h-5 ${iconText}`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-faint mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { settings, loading, save } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  const [business, setBusiness] = useState({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_tagline: '',
  });

  const [receipt, setReceipt] = useState({
    receipt_show_business: '0',
    receipt_footer: '',
  });

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [appVersion, setAppVersion] = useState('');
  const [updateChannel, setUpdateChannel] = useState<'latest' | 'beta'>(
    'latest',
  );
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const [exportingBackup, setExportingBackup] = useState(false);
  const [restorePending, setRestorePending] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await backupApi.export();
      if (res.ok) toast.success(t('settings.backup.exportSuccess'));
    } catch {
      toast.error(t('settings.backup.exportFailed'));
    } finally {
      setExportingBackup(false);
    }
  };

  const handleSelectRestore = async () => {
    const res = await backupApi.selectFile();
    if (res.filePath) setRestorePending(res.filePath);
  };

  const handleConfirmRestore = async () => {
    if (!restorePending) return;
    setRestoringBackup(true);
    try {
      const res = await backupApi.import(restorePending);
      if (!res.ok) {
        toast.error(
          res.error === 'invalid'
            ? t('settings.backup.restoreInvalid')
            : t('settings.backup.restoreFailed'),
        );
        setRestoringBackup(false);
        setRestorePending(null);
      } else {
        toast.success(t('settings.backup.restoreSuccess'));
      }
    } catch {
      toast.error(t('settings.backup.restoreFailed'));
      setRestoringBackup(false);
      setRestorePending(null);
    }
  };

  useEffect(() => {
    updaterApi
      .getVersion()
      .then(setAppVersion)
      .catch(() => {});
    updaterApi
      .getChannel()
      .then(setUpdateChannel)
      .catch(() => {});
  }, []);

  const handleSetChannel = async (channel: 'latest' | 'beta') => {
    setUpdateChannel(channel);
    try {
      await updaterApi.setChannel(channel);
      toast.success(t('settings.updates.channelSaved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const res = await updaterApi.checkForUpdates();
      if (res.error) {
        toast.error(t('settings.updates.checkFailed'));
      } else if (res.updateAvailable && res.version) {
        toast.success(
          t('settings.updates.updateAvailable', { version: res.version }),
        );
      } else {
        toast.success(t('settings.updates.upToDate'));
      }
    } catch {
      toast.error(t('settings.updates.checkFailed'));
    } finally {
      setCheckingUpdates(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setBusiness({
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_phone: settings.business_phone,
        business_email: settings.business_email,
        business_tagline: settings.business_tagline,
      });
      setReceipt({
        receipt_show_business: settings.receipt_show_business,
        receipt_footer: settings.receipt_footer,
      });
    }
  }, [loading, settings]);

  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      await save(business);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveReceipt = async () => {
    setSavingReceipt(true);
    try {
      await save(receipt);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingReceipt(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error(t('common.error'));
      setSigningOut(false);
    }
  };

  const bField = (key: keyof typeof business) => ({
    value: business[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setBusiness((p) => ({ ...p, [key]: e.target.value })),
  });

  const localeOptions = LOCALES.map((l) => ({ value: l.code, label: l.label }));

  const themeOptions: {
    id: TThemeMode;
    icon: ComponentType<{ className?: string }>;
    labelKey: any;
  }[] = [
    { id: 'light', icon: SunIcon, labelKey: 'settings.theme.light' },
    { id: 'dark', icon: MoonIcon, labelKey: 'settings.theme.dark' },
    {
      id: 'system',
      icon: ComputerDesktopIcon,
      labelKey: 'settings.theme.system',
    },
  ];

  const navItems: NavItemConfig[] = [
    {
      id: 'business',
      icon: BuildingStorefrontIcon,
      label: t('settings.business.title'),
      desc: t('settings.business.navDesc'),
      activeText: 'text-primary-600 dark:text-primary-400',
      activeBg: 'bg-primary-50 dark:bg-primary-900/20',
      activeBorder: 'border-primary-200 dark:border-primary-800/60',
      iconBg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      id: 'receipt',
      icon: DocumentTextIcon,
      label: t('settings.receipt.title'),
      desc: t('settings.receipt.navDesc'),
      activeText: 'text-violet-600 dark:text-violet-400',
      activeBg: 'bg-violet-50 dark:bg-violet-900/20',
      activeBorder: 'border-violet-200 dark:border-violet-800/60',
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      id: 'app',
      icon: AdjustmentsHorizontalIcon,
      label: t('settings.app.title'),
      desc: t('settings.app.navDesc'),
      activeText: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      activeBorder: 'border-emerald-200 dark:border-emerald-800/60',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      id: 'account',
      icon: UserCircleIcon,
      label: t('settings.account.title'),
      desc: t('settings.account.navDesc'),
      activeText: 'text-rose-600 dark:text-rose-400',
      activeBg: 'bg-rose-50 dark:bg-rose-900/20',
      activeBorder: 'border-rose-200 dark:border-rose-800/60',
      iconBg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      id: 'backup',
      icon: CircleStackIcon,
      label: t('settings.backup.title'),
      desc: t('settings.backup.navDesc'),
      activeText: 'text-teal-600 dark:text-teal-400',
      activeBg: 'bg-teal-50 dark:bg-teal-900/20',
      activeBorder: 'border-teal-200 dark:border-teal-800/60',
      iconBg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      id: 'updates',
      icon: ArrowPathIcon,
      label: t('settings.updates.title'),
      desc: t('settings.updates.navDesc'),
      activeText: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-50 dark:bg-amber-900/20',
      activeBorder: 'border-amber-200 dark:border-amber-800/60',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  return (
    <AppLayout>
      <div className="flex gap-5 items-start">
        {/* ── Left sidebar nav ── */}
        <div className="w-52 shrink-0 sticky top-0">
          <div className="bg-surface rounded-2xl border border-edge shadow-sm p-2">
            <p className="text-[10px] font-semibold text-ink-ghost uppercase tracking-widest px-3 pt-2 pb-2">
              {t('settings.title')}
            </p>
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* ── Right content panel ── */}
        <div className="flex-1 min-w-0">
          {/* ── Business Profile ── */}
          {activeTab === 'business' && (
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
              <PanelHeader
                icon={BuildingStorefrontIcon}
                iconBg="bg-primary-50 dark:bg-primary-900/30"
                iconText="text-primary-600 dark:text-primary-400"
                title={t('settings.business.title')}
                desc={t('settings.business.desc')}
              />
              <div className="px-8 py-6 space-y-5">
                <TextField
                  id="s-biz-name"
                  label={t('settings.business.name')}
                  placeholder={t('settings.business.namePlaceholder')}
                  {...bField('business_name')}
                />
                <TextField
                  id="s-biz-tagline"
                  label={t('settings.business.tagline')}
                  placeholder={t('settings.business.taglinePlaceholder')}
                  {...bField('business_tagline')}
                />
                <TextField
                  id="s-biz-address"
                  label={t('settings.business.address')}
                  placeholder={t('settings.business.addressPlaceholder')}
                  {...bField('business_address')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    id="s-biz-phone"
                    label={t('settings.business.phone')}
                    placeholder={t('settings.business.phonePlaceholder')}
                    {...bField('business_phone')}
                  />
                  <TextField
                    id="s-biz-email"
                    label={t('settings.business.email')}
                    placeholder={t('settings.business.emailPlaceholder')}
                    {...bField('business_email')}
                  />
                </div>
              </div>
              <div className="px-8 py-4 bg-surface-muted/70 border-t border-edge-muted flex justify-end">
                <Button busy={savingBusiness} onClick={handleSaveBusiness}>
                  {t('settings.business.save')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Receipt ── */}
          {activeTab === 'receipt' && (
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
              <PanelHeader
                icon={DocumentTextIcon}
                iconBg="bg-violet-50 dark:bg-violet-900/30"
                iconText="text-violet-600 dark:text-violet-400"
                title={t('settings.receipt.title')}
                desc={t('settings.receipt.desc')}
              />
              <div className="px-8 py-6 space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-edge bg-surface-raised/40 px-4 py-3.5 gap-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {t('settings.receipt.showBusiness')}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {t('settings.receipt.showBusinessHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={receipt.receipt_show_business === '1'}
                    onClick={() =>
                      setReceipt((p) => ({
                        ...p,
                        receipt_show_business:
                          p.receipt_show_business === '1' ? '0' : '1',
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                      receipt.receipt_show_business === '1'
                        ? 'bg-violet-600'
                        : 'bg-edge'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                        receipt.receipt_show_business === '1'
                          ? 'ltr:translate-x-5 rtl:-translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <TextField
                  id="s-receipt-footer"
                  label={t('settings.receipt.footer')}
                  placeholder={t('settings.receipt.footerPlaceholder')}
                  hint={t('settings.receipt.footerHint')}
                  value={receipt.receipt_footer}
                  onChange={(e) =>
                    setReceipt((p) => ({
                      ...p,
                      receipt_footer: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="px-8 py-4 bg-surface-muted/70 border-t border-edge-muted flex justify-end">
                <Button busy={savingReceipt} onClick={handleSaveReceipt}>
                  {t('settings.receipt.save')}
                </Button>
              </div>
            </div>
          )}

          {/* ── App Preferences ── */}
          {activeTab === 'app' && (
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
              <PanelHeader
                icon={AdjustmentsHorizontalIcon}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                iconText="text-emerald-600 dark:text-emerald-400"
                title={t('settings.app.title')}
                desc={t('settings.app.desc')}
              />
              <div className="px-8 py-6 space-y-7">
                {/* Language */}
                <div className="max-w-sm">
                  <SelectField
                    id="s-language"
                    label={t('settings.language.label')}
                    hint={t('settings.language.hint')}
                    value={locale}
                    onChange={(v) => setLocale(v as Locale)}
                    options={localeOptions}
                  />
                </div>

                {/* Theme */}
                <div>
                  <p className="text-sm font-medium text-ink-dim mb-1">
                    {t('settings.theme.label')}
                  </p>
                  <p className="text-xs text-ink-faint mb-3">
                    {t('settings.theme.hint')}
                  </p>
                  <div className="flex gap-3">
                    {themeOptions.map(({ id, icon: Icon, labelKey }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          theme === id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-edge hover:border-edge-strong'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            theme === id
                              ? 'bg-primary-100 dark:bg-primary-800/40'
                              : 'bg-surface-muted'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${theme === id ? 'text-primary-600 dark:text-primary-400' : 'text-ink-ghost'}`}
                          />
                        </div>
                        <p
                          className={`text-xs font-semibold ${theme === id ? 'text-primary-600 dark:text-primary-400' : 'text-ink-faint'}`}
                        >
                          {t(labelKey)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sidebar style */}
                <div>
                  <p className="text-sm font-medium text-ink-dim mb-1">
                    {t('settings.sidebar.label')}
                  </p>
                  <p className="text-xs text-ink-faint mb-3">
                    {t('settings.sidebar.hint')}
                  </p>
                  <div className="flex gap-4">
                    {/* Full option */}
                    <button
                      type="button"
                      onClick={() => save({ sidebar_style: 'full' })}
                      className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                        settings.sidebar_style !== 'slim'
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                          : 'border-edge hover:border-edge-strong'
                      }`}
                    >
                      {/* Preview */}
                      <div className="flex gap-1.5 mb-2.5 justify-center">
                        <div className="w-10 h-16 rounded-md bg-surface border border-edge flex flex-col gap-1 p-1">
                          <div className="w-full h-2 rounded bg-primary-500" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-surface-muted border border-edge" />
                      </div>
                      <p
                        className={`text-xs font-semibold text-center ${settings.sidebar_style !== 'slim' ? 'text-primary-600 dark:text-primary-400' : 'text-ink-faint'}`}
                      >
                        {t('settings.sidebar.full')}
                      </p>
                    </button>

                    {/* Slim option */}
                    <button
                      type="button"
                      onClick={() => save({ sidebar_style: 'slim' })}
                      className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                        settings.sidebar_style === 'slim'
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                          : 'border-edge hover:border-edge-strong'
                      }`}
                    >
                      {/* Preview */}
                      <div className="flex gap-1.5 mb-2.5 justify-center">
                        <div className="w-5 h-16 rounded-md bg-surface border border-edge flex flex-col items-center gap-1 py-1">
                          <div className="w-3 h-3 rounded-full bg-primary-500" />
                          <div className="w-3 h-1.5 rounded bg-edge" />
                          <div className="w-3 h-1.5 rounded bg-edge" />
                          <div className="w-3 h-1.5 rounded bg-edge" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-surface-muted border border-edge" />
                      </div>
                      <p
                        className={`text-xs font-semibold text-center ${settings.sidebar_style === 'slim' ? 'text-primary-600 dark:text-primary-400' : 'text-ink-faint'}`}
                      >
                        {t('settings.sidebar.slim')}
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Backup & Restore ── */}
          {activeTab === 'backup' && (
            <>
              <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden mb-4">
                <PanelHeader
                  icon={CircleStackIcon}
                  iconBg="bg-teal-50 dark:bg-teal-900/30"
                  iconText="text-teal-600 dark:text-teal-400"
                  title={t('settings.backup.exportTitle')}
                  desc={t('settings.backup.exportDesc')}
                />
                <div className="px-8 py-4 bg-surface-muted/70 border-t border-edge-muted flex justify-end">
                  <Button
                    icon={ArrowDownTrayIcon}
                    busy={exportingBackup}
                    onClick={handleExportBackup}
                  >
                    {t('settings.backup.export')}
                  </Button>
                </div>
              </div>

              <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
                <PanelHeader
                  icon={ArrowUpTrayIcon}
                  iconBg="bg-rose-50 dark:bg-rose-900/30"
                  iconText="text-rose-600 dark:text-rose-400"
                  title={t('settings.backup.restoreTitle')}
                  desc={t('settings.backup.restoreDesc')}
                />
                <div className="px-8 py-4 bg-surface-muted/70 border-t border-edge-muted flex justify-end">
                  <Button
                    variant="danger"
                    icon={ArrowUpTrayIcon}
                    onClick={handleSelectRestore}
                  >
                    {t('settings.backup.restore')}
                  </Button>
                </div>
              </div>

              <ConfirmDialog
                isOpen={restorePending !== null}
                title={t('settings.backup.restoreConfirmTitle')}
                message={t('settings.backup.restoreConfirmMessage')}
                confirmLabel={t('settings.backup.restoreConfirm')}
                cancelLabel={t('common.cancel')}
                confirmVariant="danger"
                busy={restoringBackup}
                onConfirm={handleConfirmRestore}
                onCancel={() => setRestorePending(null)}
              />
            </>
          )}

          {/* ── Updates ── */}
          {activeTab === 'updates' && (
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
              <PanelHeader
                icon={ArrowPathIcon}
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                iconText="text-amber-600 dark:text-amber-400"
                title={t('settings.updates.title')}
                desc={t('settings.updates.desc')}
              />
              <div className="px-8 py-6 space-y-7">
                {/* Current version */}
                <div className="flex items-center justify-between rounded-xl border border-edge bg-surface-raised/40 px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {t('settings.updates.version')}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5 font-mono">
                      v{appVersion || '—'}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                </div>

                {/* Channel picker */}
                <div>
                  <p className="text-sm font-medium text-ink-dim mb-1">
                    {t('settings.updates.channel')}
                  </p>
                  <p className="text-xs text-ink-faint mb-3">
                    {t('settings.updates.channelHint')}
                  </p>
                  <div className="flex gap-3">
                    {[
                      {
                        id: 'latest' as const,
                        label: t('settings.updates.stable'),
                        icon: CheckCircleIcon,
                      },
                      {
                        id: 'beta' as const,
                        label: t('settings.updates.beta'),
                        icon: BeakerIcon,
                      },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSetChannel(id)}
                        className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          updateChannel === id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-edge hover:border-edge-strong'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            updateChannel === id
                              ? 'bg-amber-100 dark:bg-amber-800/40'
                              : 'bg-surface-muted'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${updateChannel === id ? 'text-amber-600 dark:text-amber-400' : 'text-ink-ghost'}`}
                          />
                        </div>
                        <p
                          className={`text-xs font-semibold ${updateChannel === id ? 'text-amber-600 dark:text-amber-400' : 'text-ink-faint'}`}
                        >
                          {label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-surface-muted/70 border-t border-edge-muted flex justify-end">
                <Button
                  icon={ArrowPathIcon}
                  busy={checkingUpdates}
                  onClick={handleCheckForUpdates}
                >
                  {t('settings.updates.checkForUpdates')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Account ── */}
          {activeTab === 'account' && (
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
              <PanelHeader
                icon={UserCircleIcon}
                iconBg="bg-rose-50 dark:bg-rose-900/30"
                iconText="text-rose-600 dark:text-rose-400"
                title={t('settings.account.title')}
                desc={t('settings.account.desc')}
              />
              <div className="px-8 py-6">
                <div className="flex items-center justify-between rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-900/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t('settings.account.signOut')}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {t('settings.account.signOutDesc')}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    icon={ArrowRightStartOnRectangleIcon}
                    busy={signingOut}
                    onClick={handleSignOut}
                  >
                    {t('settings.account.signOut')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
