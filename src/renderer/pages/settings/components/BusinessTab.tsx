import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import { useSettings } from '@hooks/useSettings';
import { PanelHeader, PanelFooter } from './_shared';

export default function BusinessTab() {
  const { t } = useTranslation();
  const { settings, loading, save } = useSettings();
  const [form, setForm] = useState({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_tagline: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_phone: settings.business_phone,
        business_email: settings.business_email,
        business_tagline: settings.business_tagline,
      });
    }
  }, [loading, settings]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(form);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
      <PanelHeader
        icon={BuildingStorefrontIcon}
        title={t('settings.business.title')}
        desc={t('settings.business.desc')}
      />
      <div className="px-7 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="s-biz-name"
            label={t('settings.business.name')}
            placeholder={t('settings.business.namePlaceholder')}
            {...field('business_name')}
          />
          <TextField
            id="s-biz-tagline"
            label={t('settings.business.tagline')}
            placeholder={t('settings.business.taglinePlaceholder')}
            {...field('business_tagline')}
          />
        </div>
        <TextField
          id="s-biz-address"
          label={t('settings.business.address')}
          placeholder={t('settings.business.addressPlaceholder')}
          {...field('business_address')}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="s-biz-phone"
            label={t('settings.business.phone')}
            placeholder={t('settings.business.phonePlaceholder')}
            {...field('business_phone')}
          />
          <TextField
            id="s-biz-email"
            label={t('settings.business.email')}
            placeholder={t('settings.business.emailPlaceholder')}
            {...field('business_email')}
          />
        </div>
      </div>
      <PanelFooter>
        <Button busy={saving} onClick={handleSave}>
          {t('settings.business.save')}
        </Button>
      </PanelFooter>
    </div>
  );
}
