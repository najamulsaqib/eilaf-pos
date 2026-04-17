import { useState, useEffect, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import SelectField from '@components/ui/SelectField';
import { useLocale } from '@contexts/LocaleContext';
import { useAuth } from '@contexts/AuthContext';
import { useSettings } from '@hooks/useSettings';
import { LOCALES, Locale } from '@i18n/index';

type Tab = 'business' | 'receipt' | 'app' | 'account';

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
        w-full text-start px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer
        ${
          active
            ? `${item.activeBg} ${item.activeBorder} border`
            : 'hover:bg-slate-50 border border-transparent'
        }
      `}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? item.iconBg : 'bg-slate-100'}`}
      >
        <Icon
          className={`w-4 h-4 ${active ? item.activeText : 'text-slate-400'}`}
        />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${active ? 'text-slate-900' : 'text-slate-600'}`}
        >
          {item.label}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{item.desc}</p>
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
    <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-5 h-5 ${iconText}`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
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

  const navItems: NavItemConfig[] = [
    {
      id: 'business',
      icon: BuildingStorefrontIcon,
      label: t('settings.business.title'),
      desc: t('settings.business.navDesc'),
      activeText: 'text-blue-600',
      activeBg: 'bg-blue-50',
      activeBorder: 'border-blue-200',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'receipt',
      icon: DocumentTextIcon,
      label: t('settings.receipt.title'),
      desc: t('settings.receipt.navDesc'),
      activeText: 'text-violet-600',
      activeBg: 'bg-violet-50',
      activeBorder: 'border-violet-200',
      iconBg: 'bg-violet-50',
    },
    {
      id: 'app',
      icon: AdjustmentsHorizontalIcon,
      label: t('settings.app.title'),
      desc: t('settings.app.navDesc'),
      activeText: 'text-emerald-600',
      activeBg: 'bg-emerald-50',
      activeBorder: 'border-emerald-200',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'account',
      icon: UserCircleIcon,
      label: t('settings.account.title'),
      desc: t('settings.account.navDesc'),
      activeText: 'text-rose-600',
      activeBg: 'bg-rose-50',
      activeBorder: 'border-rose-200',
      iconBg: 'bg-rose-50',
    },
  ];

  return (
    <AppLayout>
      <div className="flex gap-5 items-start">
        {/* ── Left sidebar nav ── */}
        <div className="w-52 shrink-0 sticky top-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-2">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <PanelHeader
                icon={BuildingStorefrontIcon}
                iconBg="bg-blue-50"
                iconText="text-blue-600"
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
              <div className="px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
                <Button busy={savingBusiness} onClick={handleSaveBusiness}>
                  {t('settings.business.save')}
                </Button>
              </div>
            </div>
          )}

          {/* ── Receipt ── */}
          {activeTab === 'receipt' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <PanelHeader
                icon={DocumentTextIcon}
                iconBg="bg-violet-50"
                iconText="text-violet-600"
                title={t('settings.receipt.title')}
                desc={t('settings.receipt.desc')}
              />
              <div className="px-8 py-6 space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3.5 gap-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {t('settings.receipt.showBusiness')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
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
                        : 'bg-slate-200'
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
              <div className="px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
                <Button busy={savingReceipt} onClick={handleSaveReceipt}>
                  {t('settings.receipt.save')}
                </Button>
              </div>
            </div>
          )}

          {/* ── App Preferences ── */}
          {activeTab === 'app' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <PanelHeader
                icon={AdjustmentsHorizontalIcon}
                iconBg="bg-emerald-50"
                iconText="text-emerald-600"
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

                {/* Sidebar style */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {t('settings.sidebar.label')}
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    {t('settings.sidebar.hint')}
                  </p>
                  <div className="flex gap-4">
                    {/* Full option */}
                    <button
                      type="button"
                      onClick={() => save({ sidebar_style: 'full' })}
                      className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                        settings.sidebar_style !== 'slim'
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Preview */}
                      <div className="flex gap-1.5 mb-2.5 justify-center">
                        <div className="w-10 h-16 rounded-md bg-white border border-slate-200 flex flex-col gap-1 p-1">
                          <div className="w-full h-2 rounded bg-blue-500" />
                          <div className="w-full h-1.5 rounded bg-slate-200" />
                          <div className="w-full h-1.5 rounded bg-slate-200" />
                          <div className="w-full h-1.5 rounded bg-slate-200" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-slate-100 border border-slate-200" />
                      </div>
                      <p
                        className={`text-xs font-semibold text-center ${settings.sidebar_style !== 'slim' ? 'text-blue-600' : 'text-slate-500'}`}
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
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Preview */}
                      <div className="flex gap-1.5 mb-2.5 justify-center">
                        <div className="w-5 h-16 rounded-md bg-white border border-slate-200 flex flex-col items-center gap-1 py-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div className="w-3 h-1.5 rounded bg-slate-200" />
                          <div className="w-3 h-1.5 rounded bg-slate-200" />
                          <div className="w-3 h-1.5 rounded bg-slate-200" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-slate-100 border border-slate-200" />
                      </div>
                      <p
                        className={`text-xs font-semibold text-center ${settings.sidebar_style === 'slim' ? 'text-blue-600' : 'text-slate-500'}`}
                      >
                        {t('settings.sidebar.slim')}
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Account ── */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <PanelHeader
                icon={UserCircleIcon}
                iconBg="bg-rose-50"
                iconText="text-rose-600"
                title={t('settings.account.title')}
                desc={t('settings.account.desc')}
              />
              <div className="px-8 py-6">
                <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {t('settings.account.signOut')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
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
