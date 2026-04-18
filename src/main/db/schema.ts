import { getDb } from './database';

function hasColumn(table: string, column: string): boolean {
  const db = getDb();
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return cols.some((c) => c.name === column);
}

function ensureColumn(table: string, column: string, definition: string): void {
  const db = getDb();
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function initSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      price      REAL    NOT NULL DEFAULT 0,
      category   TEXT,
      is_active  INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS product_pricing_options (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      unit           TEXT    NOT NULL,
      price          REAL    NOT NULL,
      allows_decimal INTEGER NOT NULL DEFAULT 0,
      is_default     INTEGER NOT NULL DEFAULT 0,
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_product_pricing_product_id
      ON product_pricing_options(product_id);

    CREATE TABLE IF NOT EXISTS bills (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number   TEXT    UNIQUE NOT NULL,
      customer_name TEXT,
      subtotal      REAL    NOT NULL DEFAULT 0,
      discount      REAL    NOT NULL DEFAULT 0,
      total         REAL    NOT NULL DEFAULT 0,
      notes         TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id    INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name       TEXT    NOT NULL,
      unit       TEXT,
      price      REAL    NOT NULL,
      quantity   REAL    NOT NULL DEFAULT 1,
      total      REAL    NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  ensureColumn('products', 'barcode', 'TEXT');
  ensureColumn('bill_items', 'unit', 'TEXT');

  const productsWithoutOptions = db
    .prepare(
      `SELECT p.id, p.price
     FROM products p
     LEFT JOIN product_pricing_options o ON o.product_id = p.id
     GROUP BY p.id
     HAVING COUNT(o.id) = 0`,
    )
    .all() as Array<{ id: number; price: number }>;

  if (productsWithoutOptions.length > 0) {
    const insertDefault = db.prepare(
      `INSERT INTO product_pricing_options
       (product_id, unit, price, allows_decimal, is_default, sort_order)
       VALUES (?, 'piece', ?, 0, 1, 0)`,
    );
    const tx = db.transaction((rows: Array<{ id: number; price: number }>) => {
      for (const row of rows) {
        insertDefault.run(row.id, row.price);
      }
    });
    tx(productsWithoutOptions);
  }
}
