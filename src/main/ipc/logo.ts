import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

const logoPath = () => path.join(app.getPath('userData'), 'receipt-logo.dat');

export function registerLogoHandlers(): void {
  ipcMain.handle('logo:set', (_e, dataUri: string) => {
    const dest = logoPath();
    fs.writeFileSync(dest, dataUri, 'utf-8');
    return { ok: true };
  });

  ipcMain.handle('logo:get', () => {
    const src = logoPath();
    if (!fs.existsSync(src)) return null;
    return fs.readFileSync(src, 'utf-8');
  });

  ipcMain.handle('logo:delete', () => {
    const src = logoPath();
    if (fs.existsSync(src)) fs.unlinkSync(src);
    return { ok: true };
  });
}

export function getLogoDataUri(): string | null {
  const src = logoPath();
  if (!fs.existsSync(src)) return null;
  return fs.readFileSync(src, 'utf-8');
}
