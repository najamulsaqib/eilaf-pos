import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import fs from 'fs';
import bwipjs from 'bwip-js';
import { getDb } from '../db/database';

function getSettings(): Record<string, string> {
  const rows = getDb()
    .prepare('SELECT key, value FROM app_settings')
    .all() as Array<{ key: string; value: string }>;
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

function printHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    win.webContents.once('did-finish-load', () => {
      win.webContents.print(
        { silent: false, printBackground: true },
        async (success, err) => {
          if (success) {
            win.close();
            resolve();
            return;
          }
          // Fall back to PDF save when no printer is available
          try {
            const pdf = await win.webContents.printToPDF({
              printBackground: true,
            });
            win.close();
            const { filePath, canceled } = await dialog.showSaveDialog({
              title: 'Save as PDF',
              defaultPath: `report-${Date.now()}.pdf`,
              filters: [{ name: 'PDF', extensions: ['pdf'] }],
            });
            if (!canceled && filePath) {
              fs.writeFileSync(filePath, pdf);
              shell.openPath(filePath);
            }
            resolve();
          } catch (pdfErr) {
            win.close();
            reject(pdfErr ?? new Error(err));
          }
        },
      );
    });
  });
}

function formatCurrency(n: number): string {
  return `Rs ${n.toLocaleString('en-PK')}`;
}

function billHtml(bill: IBill, settings: Record<string, string>): string {
  const showBusiness = settings.receipt_show_business !== '0';
  const footer = settings.receipt_footer ?? '';
  const businessName = settings.business_name ?? '';
  const address = settings.business_address ?? '';
  const phone = settings.business_phone ?? '';

  const itemRows = (bill.items ?? [])
    .map(
      (i) => `<tr>
        <td>${i.name}${i.unit ? ` <small>(${i.unit})</small>` : ''}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">${formatCurrency(i.price)}</td>
        <td style="text-align:right">${formatCurrency(i.total)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 12px; max-width: 300px; }
    h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
    .sub { font-size: 11px; text-align: center; color: #555; margin: 0 0 8px; }
    hr { border: none; border-top: 1px dashed #999; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; text-align: left; padding: 2px 0; border-bottom: 1px solid #ccc; }
    th:not(:first-child) { text-align: right; }
    td { padding: 3px 0; vertical-align: top; }
    td small { color: #777; }
    .totals td { padding: 2px 0; }
    .totals .label { font-weight: bold; }
    .grand { font-size: 14px; font-weight: bold; }
    .footer { text-align: center; font-size: 11px; color: #555; margin-top: 8px; }
  </style>
  </head><body>
  ${showBusiness && businessName ? `<h1>${businessName}</h1>` : '<h1>Receipt</h1>'}
  ${showBusiness && address ? `<p class="sub">${address}</p>` : ''}
  ${showBusiness && phone ? `<p class="sub">${phone}</p>` : ''}
  <hr/>
  <p class="sub">Bill: ${bill.bill_number} &nbsp;|&nbsp; ${new Date(bill.created_at).toLocaleString()}</p>
  ${bill.customer_name ? `<p class="sub">Customer: ${bill.customer_name}</p>` : ''}
  <hr/>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <hr/>
  <table class="totals">
    <tr><td class="label">Subtotal</td><td style="text-align:right">${formatCurrency(bill.subtotal)}</td></tr>
    ${bill.discount ? `<tr><td class="label">Discount</td><td style="text-align:right">-${formatCurrency(bill.discount)}</td></tr>` : ''}
    <tr class="grand"><td>TOTAL</td><td style="text-align:right">${formatCurrency(bill.total)}</td></tr>
  </table>
  ${footer ? `<hr/><p class="footer">${footer}</p>` : ''}
  </body></html>`;
}

function reportHtml(
  data: IReportSummary,
  settings: Record<string, string>,
): string {
  const businessName = settings.business_name ?? 'Report';
  const topRows = data.topItems
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${formatCurrency(i.amount)}</td></tr>`,
    )
    .join('');
  const dayRows = data.paymentsByDay
    .map(
      (d) =>
        `<tr><td>${d.day}</td><td style="text-align:center">${d.bills}</td><td style="text-align:right">${formatCurrency(d.amount)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #666; margin: 0 0 12px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { font-size: 11px; background: #f5f5f5; padding: 6px 8px; text-align: left; border: 1px solid #ddd; }
    td { padding: 5px 8px; border: 1px solid #eee; }
    .stats { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat { flex: 1; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 10px; }
    .stat .val { font-size: 18px; font-weight: bold; }
    .stat .lbl { font-size: 11px; color: #666; }
  </style>
  </head><body>
  <h1>${businessName}</h1>
  <p class="sub">Sales Report &nbsp;|&nbsp; ${data.from} to ${data.to}</p>
  <hr/>
  <div class="stats">
    <div class="stat"><div class="val">${data.totals.bills_count}</div><div class="lbl">Total Bills</div></div>
    <div class="stat"><div class="val">${formatCurrency(data.totals.discount)}</div><div class="lbl">Total Discount</div></div>
    <div class="stat"><div class="val">${formatCurrency(data.totals.revenue)}</div><div class="lbl">Total Revenue</div></div>
  </div>
  <h2 style="font-size:13px;margin:0 0 6px">Sales by Day</h2>
  <table><thead><tr><th>Day</th><th>Bills</th><th>Amount</th></tr></thead><tbody>${dayRows}</tbody></table>
  <h2 style="font-size:13px;margin:0 0 6px">Top Items</h2>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${topRows}</tbody></table>
  </body></html>`;
}

async function barcodeHtml(items: IBarcodePrintItemInput[]): Promise<string> {
  const CHUNK = 40;
  const allLabels: string[] = [];

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const chunkLabels = await Promise.all(
      chunk.map(async (item) => {
        let imgTag = '';
        try {
          const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: item.barcode,
            scale: 2,
            height: 10,
            includetext: true,
            textxalign: 'center',
            textsize: 8,
          });
          imgTag = `<img src="data:image/png;base64,${png.toString('base64')}" style="max-width:100%;height:auto;" />`;
        } catch {
          imgTag = `<div class="barcode-text">${item.barcode}</div>`;
        }
        const label = `
          <div class="label">
            <div class="name">${item.name}</div>
            ${imgTag}
            ${item.price != null ? `<div class="price">Rs ${item.price}${item.unit ? ` / ${item.unit}` : ''}</div>` : ''}
          </div>`;
        return Array(item.copies ?? 1).fill(label).join('');
      }),
    );
    allLabels.push(...chunkLabels);
    // yield between chunks so the event loop stays alive
    await new Promise<void>((r) => setImmediate(r));
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { margin: 0; padding: 8px; }
    .label { display: inline-block; border: 1px solid #ccc; border-radius: 3px; padding: 6px 8px;
             margin: 4px; width: 200px; text-align: center; vertical-align: top; font-family: sans-serif; page-break-inside: avoid; }
    .name { font-size: 11px; font-weight: bold; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 4px; }
    .barcode-text { font-size: 10px; font-family: monospace; letter-spacing: 2px; margin: 4px 0; }
    .price { font-size: 13px; font-weight: bold; margin-top: 4px; }
  </style>
  </head><body>${allLabels.join('')}</body></html>`;
}

export function registerPrintHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('print:bill', async (_, billId: number) => {
    const db = getDb();
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId) as
      | IBill
      | undefined;
    if (!bill) throw new Error('Bill not found');
    const items = db
      .prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id')
      .all(billId) as IBillItem[];
    const settings = getSettings();
    await printHtml(billHtml({ ...bill, items }, settings));
    return { ok: true };
  });

  ipcMain.handle(
    'print:product-barcodes',
    async (_, items: IBarcodePrintItemInput[]) => {
      await printHtml(await barcodeHtml(items));
      return { ok: true };
    },
  );

  ipcMain.handle('print:report', async (_, data: IReportSummary) => {
    const settings = getSettings();
    await printHtml(reportHtml(data, settings));
    return { ok: true };
  });

  void mainWindow;
}
