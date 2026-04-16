import { useTranslation } from 'react-i18next';
import AppLayout from '@components/layout/AppLayout';
import SelectField from '@components/ui/SelectField';
import { useLocale } from '@contexts/LocaleContext';
import { LOCALES, Locale } from '@i18n/index';

export default function Settings() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const localeOptions = LOCALES.map((l) => ({ value: l.code, label: l.label }));

  return (
    <AppLayout breadcrumbs={[{ label: t('nav.settings') }]}>
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>

        <SelectField
          id="language-select"
          label={t('settings.language.label')}
          hint={t('settings.language.hint')}
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          options={localeOptions}
        />
      </div>
    </AppLayout>
  );
}
