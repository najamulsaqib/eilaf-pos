---
description: Expert in SQLite architecture for eilaf-pos using better-sqlite3, repositories, transactions, and IPC-safe boundaries.
---

# SQLite Skill

You are a SQLite expert for eilaf-pos.

## Purpose

Implement and maintain local POS persistence with `better-sqlite3` in the Electron main process.

## Responsibilities

1. Design and evolve SQLite schema for POS modules
2. Implement repository methods with prepared statements
3. Use transactions for atomic multi-step writes
4. Expose repository operations through typed IPC handlers
5. Keep renderer isolated from direct DB access

## Architecture

- DB access: `src/main/db/`
- IPC handlers: `src/main/ipc/`
- Preload bridge: `src/main/preload.ts`
- Renderer usage: hooks/services only

## Rules

- Never import `better-sqlite3` from renderer code
- Never run raw SQL through generic IPC endpoints
- Keep SQL parameterized
- Keep migration scripts idempotent and ordered
- Handle and map SQLite errors to domain-friendly messages

## Repository Pattern

```typescript
import Database from 'better-sqlite3';

export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  price: number;
  created_at: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  price: number;
  createdAt: string;
};

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    createdAt: row.created_at,
  };
}

export function createProductRepo(db: Database.Database) {
  const insertStmt = db.prepare(
    `INSERT INTO products (sku, name, price) VALUES (?, ?, ?)`,
  );

  const listStmt = db.prepare(
    `SELECT id, sku, name, price, created_at FROM products ORDER BY id DESC`,
  );

  return {
    create(input: { sku: string; name: string; price: number }): Product {
      const info = insertStmt.run(input.sku, input.name, input.price);
      const row = db
        .prepare(
          `SELECT id, sku, name, price, created_at FROM products WHERE id = ?`,
        )
        .get(info.lastInsertRowid) as ProductRow;
      return mapRow(row);
    },

    list(): Product[] {
      const rows = listStmt.all() as ProductRow[];
      return rows.map(mapRow);
    },
  };
}
```

## Transactions

Use transactions when one user action changes multiple tables.

```typescript
const commitSale = db.transaction((sale, lines) => {
  const saleInfo = insertSale.run(sale.customerId, sale.total);
  for (const line of lines) {
    insertSaleLine.run(
      saleInfo.lastInsertRowid,
      line.productId,
      line.qty,
      line.unitPrice,
    );
    decrementStock.run(line.qty, line.productId);
  }
  return saleInfo.lastInsertRowid;
});
```

## IPC Pattern

- Handler names should describe domain action
- Validate payload before repository call
- Return structured success/error payloads

## Checklist

- [ ] Schema/migrations updated safely
- [ ] Repository methods are focused and typed
- [ ] Writes are parameterized
- [ ] Multi-step operations are transactional
- [ ] Renderer access only through preload + IPC
