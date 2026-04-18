import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@components/layout/AppLayout';
import TabBar from '@components/ui/TabBar';
import BusinessTab from './components/BusinessTab';
import ReceiptTab from './components/ReceiptTab';
import PreferencesTab from './components/PreferencesTab';
import SystemTab from './components/SystemTab';

type Tab = 'business' | 'receipt' | 'preferences' | 'system';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  const tabs = [
    {
      id: 'business',
      label: t('settings.business.title'),
      icon: BuildingStorefrontIcon,
    },
    {
      id: 'receipt',
      label: t('settings.receipt.title'),
      icon: DocumentTextIcon,
    },
    {
      id: 'preferences',
      label: t('settings.preferences.title'),
      icon: AdjustmentsHorizontalIcon,
    },
    {
      id: 'system',
      label: t('settings.system.title'),
      icon: CircleStackIcon,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-ink">{t('settings.title')}</h1>
        <TabBar
          tabs={tabs}
          variant="pills"
          value={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
        />
        <div>
          {activeTab === 'business' && <BusinessTab />}
          {activeTab === 'receipt' && <ReceiptTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </AppLayout>
  );
}
