import { ipcMain } from 'electron';
import { getDb } from '../db/database';

function readAll(): Record<string, string> {
  const db = getDb();
  const rows = db
    .prepare('SELECT key, value FROM app_settings')
    .all() as Array<{ key: string; value: string }>;
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-all', () => readAll());

  ipcMain.handle('settings:set', (_, updates: Record<string, string>) => {
    const db = getDb();
    const upsert = db.prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    const tx = db.transaction((data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, value ?? '');
      }
    });
    tx(updates);
    return { ok: true };
  });
}
