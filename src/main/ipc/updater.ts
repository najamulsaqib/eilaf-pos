import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { getDb } from '../db/database';

const CHANNEL_KEY = 'update_channel';

function getStoredChannel(): 'latest' | 'beta' {
  try {
    const db = getDb();
    const row = db
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get(CHANNEL_KEY) as { value: string } | undefined;
    return row?.value === 'beta' ? 'beta' : 'latest';
  } catch {
    return 'latest';
  }
}

export function applyStoredChannel(): void {
  autoUpdater.channel = getStoredChannel();
}

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:getVersion', () => app.getVersion());

  ipcMain.handle('updater:getChannel', () => getStoredChannel());

  ipcMain.handle('updater:setChannel', (_, channel: 'latest' | 'beta') => {
    const db = getDb();
    db.prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(CHANNEL_KEY, channel);
    autoUpdater.channel = channel;
    return { ok: true };
  });

  ipcMain.handle('updater:checkForUpdates', async () => {
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      if (result?.updateInfo) {
        return {
          updateAvailable: result.updateInfo.version !== app.getVersion(),
          version: result.updateInfo.version,
        };
      }
      return { updateAvailable: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check failed';
      return { updateAvailable: false, error: msg };
    }
  });
}
