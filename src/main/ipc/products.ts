import { ipcMain } from 'electron';
import { getDb } from '../db/database';

type PricingOptionInput = {
  unit: string;
  price: number;
  allows_decimal?: boolean;
  is_default?: boolean;
};

function normalizeOptions(options: PricingOptionInput[]): PricingOptionInput[] {
  const cleaned = options
    .map((opt) => ({
      unit: opt.unit.trim(),
      price: Number(opt.price),
      allows_decimal: Boolean(opt.allows_decimal),
      is_default: Boolean(opt.is_default),
    }))
    .filter((opt) => opt.unit && Number.isFinite(opt.price) && opt.price >= 0);

  if (cleaned.length === 0) {
    return [
      { unit: 'piece', price: 0, allows_decimal: false, is_default: true },
    ];
  }

  const hasExplicitDefault = cleaned.some((opt) => opt.is_default);
  return cleaned.map((opt, idx) => ({
    ...opt,
    is_default: hasExplicitDefault ? opt.is_default : idx === 0,
  }));
}

function listProductsWithOptions() {
  const db = getDb();
  const products = db
    .prepare(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY category, name',
    )
    .all() as Array<Record<string, unknown> & { id: number }>;

  if (products.length === 0) return [];

  const options = db
    .prepare(
      `SELECT *
     FROM product_pricing_options
     WHERE product_id IN (${products.map(() => '?').join(',')})
     ORDER BY product_id, sort_order, id`,
    )
    .all(...products.map((p) => p.id)) as Array<
    Record<string, unknown> & { product_id: number }
  >;

  const byProductId = new Map<number, Array<Record<string, unknown>>>();
  for (const opt of options) {
    const list = byProductId.get(opt.product_id) ?? [];
    list.push(opt);
    byProductId.set(opt.product_id, list);
  }

  return products.map((product) => ({
    ...product,
    pricing_options: byProductId.get(product.id) ?? [],
  }));
}

function listProductsCatalog(opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  orderBy?: 'default' | 'top_selling';
}) {
  const db = getDb();
  const {
    page = 0,
    pageSize = 40,
    search = '',
    category = '',
    orderBy = 'default',
  } = opts;
  const offset = page * pageSize;

  const conditions: string[] = ['p.is_active = 1'];
  const params: unknown[] = [];

  if (search) {
    conditions.push('(p.name LIKE ? OR p.barcode LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push('p.category = ?');
    params.push(category);
  }

  const where = conditions.join(' AND ');

  const orderClause =
    orderBy === 'top_selling'
      ? 'ORDER BY sold_qty DESC, p.name ASC'
      : 'ORDER BY p.category, p.name';

  const { count } = db
    .prepare(
      `SELECT COUNT(*) as count FROM products p WHERE ${where}`,
    )
    .get(...params) as { count: number };

  const allCategories = (
    db
      .prepare(
        'SELECT DISTINCT category FROM products WHERE is_active = 1 AND category IS NOT NULL ORDER BY category',
      )
      .all() as Array<{ category: string }>
  ).map((r) => r.category);

  const products = db
    .prepare(
      `SELECT p.*, COALESCE(SUM(bi.quantity), 0) AS sold_qty
       FROM products p
       LEFT JOIN bill_items bi ON bi.product_id = p.id
       WHERE ${where}
       GROUP BY p.id
       ${orderClause}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as Array<
    Record<string, unknown> & { id: number }
  >;

  if (products.length === 0) {
    return { products: [], total: count, allCategories };
  }

  const options = db
    .prepare(
      `SELECT * FROM product_pricing_options
       WHERE product_id IN (${products.map(() => '?').join(',')})
       ORDER BY product_id, sort_order, id`,
    )
    .all(...products.map((p) => p.id)) as Array<
    Record<string, unknown> & { product_id: number }
  >;

  const byProductId = new Map<number, Array<Record<string, unknown>>>();
  for (const opt of options) {
    const list = byProductId.get(opt.product_id) ?? [];
    list.push(opt);
    byProductId.set(opt.product_id, list);
  }

  return {
    products: products.map((p) => ({
      ...p,
      pricing_options: byProductId.get(p.id) ?? [],
    })),
    total: count,
    allCategories,
  };
}

export function registerProductHandlers(): void {
  ipcMain.handle('db:products:list', () => {
    return listProductsWithOptions();
  });

  ipcMain.handle(
    'db:products:catalog',
    (
      _,
      opts: {
        page?: number;
        pageSize?: number;
        search?: string;
        category?: string;
        orderBy?: 'default' | 'top_selling';
      } = {},
    ) => {
      return listProductsCatalog(opts);
    },
  );

  ipcMain.handle(
    'db:products:create',
    (
      _,
      data: {
        name: string;
        barcode?: string;
        category?: string;
        pricing_options: PricingOptionInput[];
      },
    ) => {
      const db = getDb();
      const options = normalizeOptions(data.pricing_options ?? []);
      const defaultOption = options.find((opt) => opt.is_default) ?? options[0];

      const created = db.transaction(() => {
        const { lastInsertRowid } = db
          .prepare(
            'INSERT INTO products (name, barcode, price, category) VALUES (?, ?, ?, ?)',
          )
          .run(
            data.name.trim(),
            data.barcode?.trim() || null,
            defaultOption.price,
            data.category ?? null,
          );

        const productId = Number(lastInsertRowid);
        const insertOption = db.prepare(
          `INSERT INTO product_pricing_options
           (product_id, unit, price, allows_decimal, is_default, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
        );

        options.forEach((opt, idx) => {
          insertOption.run(
            productId,
            opt.unit,
            opt.price,
            opt.allows_decimal ? 1 : 0,
            opt.is_default ? 1 : 0,
            idx,
          );
        });

        return productId;
      })();

      return (
        listProductsWithOptions().find((product) => product.id === created) ??
        null
      );
    },
  );

  ipcMain.handle(
    'db:products:update',
    (
      _,
      id: number,
      data: {
        name?: string;
        barcode?: string;
        category?: string;
        pricing_options?: PricingOptionInput[];
      },
    ) => {
      const db = getDb();
      const updatedId = db.transaction(() => {
        const sets: string[] = [];
        const vals: unknown[] = [];
        if (data.name !== undefined) {
          sets.push('name = ?');
          vals.push(data.name.trim());
        }
        if (data.barcode !== undefined) {
          sets.push('barcode = ?');
          vals.push(data.barcode.trim() || null);
        }
        if (data.category !== undefined) {
          sets.push('category = ?');
          vals.push(data.category ?? null);
        }

        if (sets.length > 0) {
          vals.push(id);
          db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(
            ...vals,
          );
        }

        if (data.pricing_options !== undefined) {
          const options = normalizeOptions(data.pricing_options);
          const defaultOption =
            options.find((opt) => opt.is_default) ?? options[0];

          db.prepare(
            'DELETE FROM product_pricing_options WHERE product_id = ?',
          ).run(id);

          const insertOption = db.prepare(
            `INSERT INTO product_pricing_options
             (product_id, unit, price, allows_decimal, is_default, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
          );
          options.forEach((opt, idx) => {
            insertOption.run(
              id,
              opt.unit,
              opt.price,
              opt.allows_decimal ? 1 : 0,
              opt.is_default ? 1 : 0,
              idx,
            );
          });

          db.prepare('UPDATE products SET price = ? WHERE id = ?').run(
            defaultOption.price,
            id,
          );
        }

        return id;
      })();

      return (
        listProductsWithOptions().find((product) => product.id === updatedId) ??
        null
      );
    },
  );

  ipcMain.handle('db:products:delete', (_, id: number) => {
    getDb().prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
  });

  ipcMain.handle(
    'products:barcode-bulk',
    (_, opts: { search?: string; category?: string } = {}) => {
      const db = getDb();
      const { search = '', category = '' } = opts;
      const conditions = ['is_active = 1', 'barcode IS NOT NULL'];
      const params: unknown[] = [];
      if (search) {
        conditions.push('(name LIKE ? OR barcode LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      return db
        .prepare(
          `SELECT id, name, barcode, price FROM products WHERE ${conditions.join(' AND ')} ORDER BY name`,
        )
        .all(...params);
    },
  );
}
