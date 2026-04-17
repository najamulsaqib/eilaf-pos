import { ipcMain } from 'electron';
import { getDb } from '../db/database';

function nextBillNumber(): string {
  const row = getDb()
    .prepare('SELECT bill_number FROM bills ORDER BY id DESC LIMIT 1')
    .get() as { bill_number: string } | undefined;
  if (!row) return 'BILL-0001';
  const n = parseInt(row.bill_number.replace('BILL-', ''), 10) + 1;
  return `BILL-${String(n).padStart(4, '0')}`;
}

export function registerBillHandlers(): void {
  ipcMain.handle(
    'db:bills:list',
    (_, opts: { page?: number; pageSize?: number } = {}) => {
      const db = getDb();
      const { page = 0, pageSize = 20 } = opts;
      const offset = page * pageSize;
      const bills = db
        .prepare(
          `SELECT b.*, COUNT(bi.id) as item_count
           FROM bills b
           LEFT JOIN bill_items bi ON bi.bill_id = b.id
           GROUP BY b.id
           ORDER BY b.created_at DESC
           LIMIT ? OFFSET ?`,
        )
        .all(pageSize, offset);
      const { count } = db
        .prepare('SELECT COUNT(*) as count FROM bills')
        .get() as { count: number };
      return { bills, total: count };
    },
  );

  ipcMain.handle('db:bills:get', (_, id: number) => {
    const db = getDb();
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) return null;
    const items = db
      .prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id')
      .all(id);
    return { ...bill, items };
  });

  ipcMain.handle(
    'db:bills:create',
    (
      _,
      data: {
        customer_name?: string;
        items: Array<{
          product_id?: number;
          name: string;
          unit?: string;
          price: number;
          quantity: number;
        }>;
        discount?: number;
        notes?: string;
      },
    ) => {
      const db = getDb();
      const billNumber = nextBillNumber();
      const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const discount = data.discount ?? 0;
      const total = Math.max(0, subtotal - discount);

      return db.transaction(() => {
        const { lastInsertRowid: billId } = db
          .prepare(
            `INSERT INTO bills (bill_number, customer_name, subtotal, discount, total, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            billNumber,
            data.customer_name ?? null,
            subtotal,
            discount,
            total,
            data.notes ?? null,
          );

        const ins = db.prepare(
          `INSERT INTO bill_items (bill_id, product_id, name, unit, price, quantity, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const item of data.items) {
          ins.run(
            billId,
            item.product_id ?? null,
            item.name,
            item.unit ?? null,
            item.price,
            item.quantity,
            item.price * item.quantity,
          );
        }
        return db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
      })();
    },
  );

  ipcMain.handle('db:bills:today-stats', () =>
    getDb()
      .prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM bills
         WHERE date(created_at) = date('now','localtime')`,
      )
      .get(),
  );

  if (process.env.NODE_ENV !== 'production') {
    ipcMain.handle('db:bills:delete', (_, id: number) => {
      const db = getDb();
      db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(id);
      db.prepare('DELETE FROM bills WHERE id = ?').run(id);
      return { ok: true };
    });
  }
}
