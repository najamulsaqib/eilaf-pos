import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import SelectField from '@components/ui/SelectField';
import { useLocale } from '@contexts/LocaleContext';
import { useTheme, type TThemeMode } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useSettings } from '@hooks/useSettings';
import { LOCALES, Locale } from '@i18n/index';
import { PanelHeader, SectionLabel, SettingsRow } from './_shared';

type ThemeOption = {
  id: TThemeMode;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
};

const themeOptions: ThemeOption[] = [
  { id: 'light', icon: SunIcon, labelKey: 'settings.theme.light' },
  { id: 'dark', icon: MoonIcon, labelKey: 'settings.theme.dark' },
  {
    id: 'system',
    icon: ComputerDesktopIcon,
    labelKey: 'settings.theme.system',
  },
];

export default function PreferencesTab() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { settings, save } = useSettings();
  const [signingOut, setSigningOut] = useState(false);

  const localeOptions = LOCALES.map((l) => ({ value: l.code, label: l.label }));

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error(t('common.error'));
      setSigningOut(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
      <PanelHeader
        icon={AdjustmentsHorizontalIcon}
        title={t('settings.preferences.title')}
        desc={t('settings.preferences.desc')}
      />

      <div className="divide-y divide-edge-muted">
        {/* ── Display ── */}
        <SectionLabel label={t('settings.preferences.displaySection')} />

        <SettingsRow
          label={t('settings.language.label')}
          hint={t('settings.language.hint')}
        >
          <div className="w-44">
            <SelectField
              id="s-language"
              value={locale}
              onChange={(v) => setLocale(v as Locale)}
              options={localeOptions}
            />
          </div>
        </SettingsRow>

        <div className="px-7 py-5">
          <p className="text-sm font-medium text-ink mb-0.5">
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
                  {t(labelKey as any)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Layout ── */}
        <SectionLabel label={t('settings.preferences.layoutSection')} />

        <div className="px-7 py-5">
          <p className="text-sm font-medium text-ink mb-0.5">
            {t('settings.sidebar.label')}
          </p>
          <p className="text-xs text-ink-faint mb-3">
            {t('settings.sidebar.hint')}
          </p>
          <div className="flex gap-3">
            {(
              [
                { value: 'full', label: t('settings.sidebar.full') },
                { value: 'slim', label: t('settings.sidebar.slim') },
              ] as const
            ).map(({ value, label }) => {
              const active =
                value === 'slim'
                  ? settings.sidebar_style === 'slim'
                  : settings.sidebar_style !== 'slim';
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => save({ sidebar_style: value })}
                  className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-edge hover:border-edge-strong'
                  }`}
                >
                  <div className="flex gap-1.5 mb-2.5 justify-center">
                    {value === 'slim' ? (
                      <>
                        <div className="w-5 h-16 rounded-md bg-surface border border-edge flex flex-col items-center gap-1 py-1">
                          <div className="w-3 h-3 rounded-full bg-primary-500" />
                          <div className="w-3 h-1.5 rounded bg-edge" />
                          <div className="w-3 h-1.5 rounded bg-edge" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-surface-muted border border-edge" />
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-16 rounded-md bg-surface border border-edge flex flex-col gap-1 p-1">
                          <div className="w-full h-2 rounded bg-primary-500" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                          <div className="w-full h-1.5 rounded bg-edge" />
                        </div>
                        <div className="flex-1 h-16 rounded-md bg-surface-muted border border-edge" />
                      </>
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold text-center ${active ? 'text-primary-600 dark:text-primary-400' : 'text-ink-faint'}`}
                  >
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Account ── */}
        <SectionLabel label={t('settings.preferences.accountSection')} />

        <SettingsRow
          label={t('settings.account.signOut')}
          hint={t('settings.account.signOutDesc')}
        >
          <Button
            variant="danger"
            size="sm"
            icon={ArrowRightStartOnRectangleIcon}
            busy={signingOut}
            onClick={handleSignOut}
          >
            {t('settings.account.signOut')}
          </Button>
        </SettingsRow>
      </div>
    </div>
  );
}
