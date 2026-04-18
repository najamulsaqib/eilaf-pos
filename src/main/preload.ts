// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'webview-navigate';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  updater: {
    getChannel: () => ipcRenderer.invoke('updater:getChannel'),
    setChannel: (channel: 'latest' | 'beta') =>
      ipcRenderer.invoke('updater:setChannel', channel),
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    getVersion: () => ipcRenderer.invoke('updater:getVersion'),
  },
  net: {
    isOnline: (): Promise<boolean> => ipcRenderer.invoke('net:isOnline'),
  },
  db: {
    products: {
      list: (): Promise<unknown> => ipcRenderer.invoke('db:products:list'),
      catalog: (opts?: unknown): Promise<unknown> =>
        ipcRenderer.invoke('db:products:catalog', opts),
      create: (data: unknown): Promise<unknown> =>
        ipcRenderer.invoke('db:products:create', data),
      update: (id: number, data: unknown): Promise<unknown> =>
        ipcRenderer.invoke('db:products:update', id, data),
      delete: (id: number): Promise<void> =>
        ipcRenderer.invoke('db:products:delete', id),
    },
    bills: {
      list: (opts?: unknown): Promise<unknown> =>
        ipcRenderer.invoke('db:bills:list', opts),
      get: (id: number): Promise<unknown> =>
        ipcRenderer.invoke('db:bills:get', id),
      create: (data: unknown): Promise<unknown> =>
        ipcRenderer.invoke('db:bills:create', data),
      todayStats: (): Promise<unknown> =>
        ipcRenderer.invoke('db:bills:today-stats'),
      delete: (id: number): Promise<unknown> =>
        ipcRenderer.invoke('db:bills:delete', id),
    },
  },
  print: {
    bill: (billId: number): Promise<unknown> =>
      ipcRenderer.invoke('print:bill', billId),
    productBarcodes: (items: unknown[]): Promise<unknown> =>
      ipcRenderer.invoke('print:product-barcodes', items),
    report: (input?: unknown): Promise<unknown> =>
      ipcRenderer.invoke('print:report', input),
  },
  reports: {
    summary: (input?: unknown): Promise<unknown> =>
      ipcRenderer.invoke('reports:summary', input),
  },
  products: {
    barcodeBulk: (opts?: { search?: string; category?: string }): Promise<unknown> =>
      ipcRenderer.invoke('products:barcode-bulk', opts),
  },
  settings: {
    getAll: (): Promise<unknown> => ipcRenderer.invoke('settings:get-all'),
    set: (updates: Record<string, string>): Promise<unknown> =>
      ipcRenderer.invoke('settings:set', updates),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
