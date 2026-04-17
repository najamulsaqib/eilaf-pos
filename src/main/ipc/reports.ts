import { ipcMain } from 'electron';
import { getDb } from '../db/database';

export function registerReportsHandlers(): void {
  ipcMain.handle(
    'reports:summary',
    (_, input: { from?: string; to?: string } = {}) => {
      const db = getDb();
      const now = new Date();
      const from =
        input?.from ??
        new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
      const to = input?.to ?? now.toISOString().split('T')[0];

      const totals = db
        .prepare(
          `SELECT
            COUNT(*) as bills_count,
            COALESCE(SUM(subtotal), 0) as subtotal,
            COALESCE(SUM(discount), 0) as discount,
            COALESCE(SUM(total), 0) as revenue
          FROM bills
          WHERE date(created_at) BETWEEN ? AND ?`,
        )
        .get(from, to);

      const topItems = db
        .prepare(
          `SELECT
            bi.name,
            SUM(bi.quantity) as qty,
            SUM(bi.total) as amount
          FROM bill_items bi
          JOIN bills b ON b.id = bi.bill_id
          WHERE date(b.created_at) BETWEEN ? AND ?
          GROUP BY bi.name
          ORDER BY amount DESC
          LIMIT 10`,
        )
        .all(from, to);

      const paymentsByDay = db
        .prepare(
          `SELECT
            date(created_at) as day,
            COUNT(*) as bills,
            COALESCE(SUM(total), 0) as amount
          FROM bills
          WHERE date(created_at) BETWEEN ? AND ?
          GROUP BY day
          ORDER BY day ASC`,
        )
        .all(from, to);

      const salesByHour = db
        .prepare(
          `SELECT
            CAST(strftime('%H', created_at) AS INTEGER) as hour,
            COUNT(*) as bills,
            COALESCE(SUM(total), 0) as amount
          FROM bills
          WHERE date(created_at) BETWEEN ? AND ?
          GROUP BY hour
          ORDER BY hour ASC`,
        )
        .all(from, to);

      return { from, to, totals, topItems, paymentsByDay, salesByHour };
    },
  );
}
