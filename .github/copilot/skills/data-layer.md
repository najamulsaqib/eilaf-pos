---
description: Expert in eilaf-pos data-layer conventions for SQLite repositories, IPC contracts, and renderer-safe data access.
---

# Data Layer Skill

You are an expert in eilaf-pos data architecture.

## Core Principle

POS business data is local-first and stored in SQLite. The renderer never talks to SQLite directly.

Data path:

1. React component/page
2. Hook (`src/renderer/hooks/`)
3. Renderer service (`src/renderer/services/`)
4. Preload bridge (`window.electron.*`)
5. IPC handler (`src/main/ipc/`)
6. Repository (`src/main/db/`)

## Responsibilities

1. Keep SQL and persistence logic in repositories only
2. Keep IPC handlers thin and explicit
3. Return UI-friendly typed models to renderer
4. Enforce validation before writes
5. Use transactions for multi-step updates

## Repository Conventions

- Use prepared statements
- Use dedicated methods (`create`, `list`, `getById`, `update`, `delete`)
- Keep SQL colocated by domain repository
- Normalize row mapping in a `mapRow` helper

```typescript
type SaleRow = {
  id: number;
  reference_number: string;
  total_amount: number;
  created_at: string;
};

type Sale = {
  id: number;
  referenceNumber: string;
  totalAmount: number;
  createdAt: string;
};

function mapRow(row: SaleRow): Sale {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}
```

## IPC Conventions

- Namespace channels by domain and action (`sales:list`, `sales:create`)
- Validate payload shape before calling repository
- Return typed responses/errors
- Do not expose generic SQL execution channels

## Renderer Conventions

- Hooks own loading/error/success state
- Pages/components do not contain persistence logic
- Use React Query for async cache and invalidation

## Supabase Boundary

Supabase is auth-only in this project. Data-layer logic for POS entities must not depend on Supabase tables.

## Checklist

- [ ] No SQLite imports in renderer
- [ ] All business writes go through IPC + repository
- [ ] Row mapping converts DB shape to frontend shape
- [ ] Multi-step writes use transactions
- [ ] Hooks/services remain the only renderer data access path
