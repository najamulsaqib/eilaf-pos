import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import IconButton from '@components/ui/IconButton';
import TextField from '@components/ui/TextField';
import { useSettings } from '@hooks/useSettings';
import { logoApi } from '@services/db';
import { PanelHeader, SettingsRow, PanelFooter } from './_shared';

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-edge-strong'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          checked ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function ReceiptTab() {
  const { t } = useTranslation();
  const { settings, loading, save } = useSettings();
  const [form, setForm] = useState({
    receipt_show_business: '0',
    receipt_footer: '',
  });
  const [saving, setSaving] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({
        receipt_show_business: settings.receipt_show_business,
        receipt_footer: settings.receipt_footer,
      });
    }
  }, [loading, settings]);

  useEffect(() => {
    logoApi
      .get()
      .then(setLogoDataUri)
      .catch(() => {});
  }, []);

  const handleLogoFile = async (file: File) => {
    setUploadingLogo(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await logoApi.set(dataUri);
      setLogoDataUri(dataUri);
      toast.success(t('settings.receipt.logoSaved'));
    } catch {
      toast.error(t('settings.receipt.logoError'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      await logoApi.delete();
      setLogoDataUri(null);
      toast.success(t('settings.receipt.logoDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

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
        icon={DocumentTextIcon}
        title={t('settings.receipt.title')}
        desc={t('settings.receipt.desc')}
      />

      <div className="divide-y divide-edge-muted">
        {/* ── Logo ── */}
        <div className="px-7 py-5">
          <p className="text-sm font-medium text-ink">
            {t('settings.receipt.logo')}
          </p>
          <p className="text-xs text-ink-faint mt-0.5">
            {t('settings.receipt.logoHint')}
          </p>

          <input
            id="logo-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoFile(file);
              e.target.value = '';
            }}
          />

          <div className="flex items-center mt-4 justify-between">
            {/* Logo box */}
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() =>
                document.getElementById('logo-file-input')?.click()
              }
              className="w-28 h-20 rounded-2xl border-2 border-dashed border-edge hover:border-primary-400 transition-colors flex items-center justify-center overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              {logoDataUri ? (
                <img
                  src={logoDataUri}
                  alt="Receipt logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 px-2">
                  <PhotoIcon className="w-5 h-5 text-ink-ghost" />
                  <span className="text-[10px] text-ink-faint text-center leading-tight">
                    {t('settings.receipt.logoUploadTitle')}
                  </span>
                </div>
              )}
            </button>

            {logoDataUri && (
              <IconButton
                icon={TrashIcon}
                variant="danger"
                size="md"
                title={t('settings.receipt.logoRemove')}
                onClick={handleLogoDelete}
              />
            )}
          </div>
        </div>

        {/* ── Show business toggle ── */}
        <SettingsRow
          label={t('settings.receipt.showBusiness')}
          hint={t('settings.receipt.showBusinessHint')}
        >
          <Toggle
            id="s-show-business"
            checked={form.receipt_show_business === '1'}
            onChange={(v) =>
              setForm((p) => ({ ...p, receipt_show_business: v ? '1' : '0' }))
            }
          />
        </SettingsRow>

        <div className="px-7 py-5">
          <TextField
            id="s-receipt-footer"
            label={t('settings.receipt.footer')}
            placeholder={t('settings.receipt.footerPlaceholder')}
            hint={t('settings.receipt.footerHint')}
            value={form.receipt_footer}
            onChange={(e) =>
              setForm((p) => ({ ...p, receipt_footer: e.target.value }))
            }
          />
        </div>
      </div>

      <PanelFooter>
        <Button busy={saving} onClick={handleSave}>
          {t('settings.receipt.save')}
        </Button>
      </PanelFooter>
    </div>
  );
}
