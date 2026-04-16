import { useTranslation } from 'react-i18next';
import AppLayout from '@components/layout/AppLayout';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <AppLayout breadcrumbs={[{ label: t('nav.dashboard') }]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <p className="mt-1 text-slate-500">{t('dashboard.welcome')}</p>
        <p className="mt-4 text-slate-700">{t('sample')}</p>
      </div>
    </AppLayout>
  );
}
