import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { closeDb, getDb } from '../db/database';

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'eilaf-pos.db');
}

function isValidBackup(filePath: string): boolean {
  try {
    console.log('[backup] validating file:', filePath);
    const testDb = new Database(filePath, { readonly: true });
    const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    testDb.close();
    console.log('[backup] validation passed, tables found:', tables.map((r: any) => r.name));
    return true;
  } catch (err) {
    console.error('[backup] validation failed:', err);
    return false;
  }
}

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const date = new Date().toISOString().slice(0, 10);
    const { filePath, canceled } = await dialog.showSaveDialog(win!, {
      title: 'Save Backup',
      defaultPath: `eilaf-pos-backup-${date}.db`,
      filters: [{ name: 'Eilaf POS Backup', extensions: ['db'] }],
    });
    if (canceled || !filePath) {
      console.log('[backup] export cancelled');
      return { ok: false };
    }

    console.log('[backup] exporting to:', filePath);
    try {
      const db = getDb();
      await db.backup(filePath);
      const stat = fs.statSync(filePath);
      console.log('[backup] export complete, size:', stat.size, 'bytes');
      return { ok: true };
    } catch (err) {
      console.error('[backup] export failed:', err);
      return { ok: false };
    }
  });

  ipcMain.handle('backup:selectFile', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const { filePaths, canceled } = await dialog.showOpenDialog(win!, {
      title: 'Select Backup File',
      filters: [{ name: 'Eilaf POS Backup', extensions: ['db'] }],
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) {
      console.log('[backup] file selection cancelled');
      return { filePath: null };
    }
    console.log('[backup] file selected:', filePaths[0]);
    return { filePath: filePaths[0] };
  });

  ipcMain.handle('backup:import', async (_, filePath: string) => {
    console.log('[backup] import requested for:', filePath);

    const fileExists = fs.existsSync(filePath);
    console.log('[backup] file exists:', fileExists);
    if (!fileExists) {
      return { ok: false, error: 'invalid' };
    }

    const stat = fs.statSync(filePath);
    console.log('[backup] file size:', stat.size, 'bytes');

    if (!isValidBackup(filePath)) {
      console.error('[backup] file failed validation, aborting restore');
      return { ok: false, error: 'invalid' };
    }

    const dbPath = getDbPath();
    console.log('[backup] closing DB at:', dbPath);
    closeDb();

    for (const suffix of ['-wal', '-shm']) {
      const sidecar = dbPath + suffix;
      if (fs.existsSync(sidecar)) {
        console.log('[backup] removing sidecar:', sidecar);
        fs.unlinkSync(sidecar);
      }
    }

    console.log('[backup] copying backup to:', dbPath);
    try {
      fs.copyFileSync(filePath, dbPath);
      const restored = fs.statSync(dbPath);
      console.log('[backup] copy complete, new db size:', restored.size, 'bytes');
    } catch (err) {
      console.error('[backup] copy failed:', err);
      return { ok: false, error: 'copy_failed' };
    }

    console.log('[backup] relaunching app...');
    app.relaunch();
    app.quit();
    return { ok: true };
  });
}
