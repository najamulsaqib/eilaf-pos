import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CircleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { updaterApi, backupApi } from '@services/db';
import { PanelHeader, SectionLabel, SettingsRow } from './_shared';

export default function SystemTab() {
  const { t } = useTranslation();

  const [exportingBackup, setExportingBackup] = useState(false);
  const [restorePending, setRestorePending] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const [appVersion, setAppVersion] = useState('');
  const [updateChannel, setUpdateChannel] = useState<'latest' | 'beta'>(
    'latest',
  );
  const [checkingUpdates, setCheckingUpdates] = useState(false);

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

  return (
    <>
      <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">
        <PanelHeader
          icon={CircleStackIcon}
          title={t('settings.system.title')}
          desc={t('settings.system.desc')}
        />

        <div className="divide-y divide-edge-muted">
          {/* ── Backup ── */}
          <SectionLabel label={t('settings.backup.title')} />

          <SettingsRow
            label={t('settings.backup.exportTitle')}
            hint={t('settings.backup.exportDesc')}
          >
            <Button
              size="sm"
              icon={ArrowDownTrayIcon}
              busy={exportingBackup}
              onClick={handleExportBackup}
            >
              {t('settings.backup.export')}
            </Button>
          </SettingsRow>

          <SettingsRow
            label={t('settings.backup.restoreTitle')}
            hint={t('settings.backup.restoreDesc')}
          >
            <Button
              size="sm"
              variant="danger"
              icon={ArrowUpTrayIcon}
              onClick={handleSelectRestore}
            >
              {t('settings.backup.restore')}
            </Button>
          </SettingsRow>

          {/* ── Updates ── */}
          <SectionLabel label={t('settings.updates.title')} />

          <SettingsRow
            label={t('settings.updates.version')}
            hint={appVersion ? `v${appVersion}` : '—'}
          >
            <CheckCircleIcon className="w-5 h-5 text-stat-green-icon" />
          </SettingsRow>

          <div className="px-7 py-5">
            <p className="text-sm font-medium text-ink mb-0.5">
              {t('settings.updates.channel')}
            </p>
            <p className="text-xs text-ink-faint mb-3">
              {t('settings.updates.channelHint')}
            </p>
            <div className="flex gap-3">
              {(
                [
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
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSetChannel(id)}
                  className={`flex-1 rounded-xl border-2 p-3 transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    updateChannel === id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-edge hover:border-edge-strong'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      updateChannel === id
                        ? 'bg-primary-100 dark:bg-primary-800/40'
                        : 'bg-surface-muted'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${updateChannel === id ? 'text-primary-600 dark:text-primary-400' : 'text-ink-ghost'}`}
                    />
                  </div>
                  <p
                    className={`text-xs font-semibold ${updateChannel === id ? 'text-primary-600 dark:text-primary-400' : 'text-ink-faint'}`}
                  >
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <SettingsRow
            label={t('settings.updates.checkForUpdates')}
            hint={appVersion ? `v${appVersion}` : undefined}
          >
            <Button
              size="sm"
              icon={ArrowPathIcon}
              busy={checkingUpdates}
              onClick={handleCheckForUpdates}
            >
              {t('settings.updates.checkForUpdates')}
            </Button>
          </SettingsRow>
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
  );
}
