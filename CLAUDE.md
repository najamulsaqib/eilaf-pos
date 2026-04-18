# eilaf-pos — Claude Code Context

## Project Overview

eilaf-pos is an Electron desktop application for point-of-sale operations.

Core architecture:

- Business data is local-first with SQLite (`better-sqlite3`)
- Supabase is used only for authentication flows (login/session/password reset)

**Stack:** Electron · React 19 · TypeScript · SQLite (`better-sqlite3`) · Supabase Auth · React Query · TailwindCSS · Heroicons · Sonner · i18next (Urdu/RTL)

---

## Mandatory Standards — read `.instructions.md` first

All coding standards, naming conventions, and architecture rules are defined in [`.instructions.md`](.instructions.md).

Key rules to internalize before writing any code:

- **No `dark:` variants in components** — all theming lives in `styles.css`; add new themes there as a single CSS class block
- **Use semantic color tokens** — `bg-surface`, `text-ink`, `border-edge`, `ring-focus-ring`, `stat-*` etc. instead of hardcoded colors (`bg-white`, `text-slate-*`, `blue-*`)
- **No direct database calls in pages/components** — renderer accesses data through hooks/services and IPC only
- **No direct `better-sqlite3` usage in renderer** — SQLite access belongs to `src/main/db/`
- **Supabase is auth-only** — do not use Supabase for POS business tables
- **No native `<select>` elements** — always use `SelectField` from `@components/ui/SelectField`
- **No raw `<button>` for actions** — use `Button`, `IconButton`, or `DropdownMenu`
- **All components are default exports** — `import Button from '@components/ui/Button'`, never named imports for UI components
- **Icons only from `@heroicons/react`** — `/20/solid` for compact, `/24/outline` or `/24/solid` for standard
- **All UI strings must be translated** — use `useTranslation()` from `react-i18next`; never hardcode text in JSX
- **RTL-safe layout** — use Tailwind logical properties (`ms-*`, `me-*`, `border-e`, `text-start`) instead of physical (`ml-*`, `mr-*`, `border-r`, `text-left`)

---

## Skill Reference Files

Deep documentation for each domain lives in `.github/copilot/skills/`. Read the relevant file before working in that area.

| File                                                    | Covers                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| [react.md](.github/copilot/skills/react.md)             | UI components, hooks patterns, routing, and React best practices     |
| [sqlite.md](.github/copilot/skills/sqlite.md)           | SQLite architecture, repositories, transactions, and IPC boundaries  |
| [data-layer.md](.github/copilot/skills/data-layer.md)   | POS data conventions, row mapping, validation, and mutation patterns |
| [supabase.md](.github/copilot/skills/supabase.md)       | Supabase authentication only (login/session/reset password)          |
| [electron.md](.github/copilot/skills/electron.md)       | Main/renderer boundaries, IPC communication, native desktop features |
| [tailwindcss.md](.github/copilot/skills/tailwindcss.md) | Tailwind conventions and responsive styling                          |
| [i18n.md](.github/copilot/skills/i18n.md)               | Localization, Urdu/RTL support, adding new locales and strings       |

---

## Component Quick Reference

All components are in `src/renderer/components/` with path alias `@components/`.

### `ui/` — Base UI Elements

| Component       | Import                         | When to use                                               |
| --------------- | ------------------------------ | --------------------------------------------------------- |
| `SelectField`   | `@components/ui/SelectField`   | Any dropdown/select (replaces native `<select>`)          |
| `Button`        | `@components/ui/Button`        | Primary actions. Props: `variant`, `size`, `busy`, `icon` |
| `IconButton`    | `@components/ui/IconButton`    | Icon-only actions in tables/toolbars                      |
| `TextField`     | `@components/ui/TextField`     | Text inputs with label, hint, error, prefix/suffix        |
| `CheckboxField` | `@components/ui/CheckboxField` | Labeled checkbox with optional hint                       |
| `Card`          | `@components/ui/Card`          | Content containers                                        |
| `Chip`          | `@components/ui/Chip`          | Status badges and tags                                    |
| `Modal`         | `@components/ui/Modal`         | Reusable modal shell                                      |
| `ConfirmDialog` | `@components/ui/ConfirmDialog` | Destructive action confirmation                           |
| `DropdownMenu`  | `@components/ui/DropdownMenu`  | Context menus with icon/badge/danger/divider items        |
| `DropZone`      | `@components/ui/DropZone`      | Drag-and-drop file upload                                 |

### `common/` — Shared Business Components

| Component           | Import                                 | When to use                                 |
| ------------------- | -------------------------------------- | ------------------------------------------- |
| `EmptyState`        | `@components/common/EmptyState`        | Zero-data placeholders with icon + CTA      |
| `LoadingSpinner`    | `@components/common/LoadingSpinner`    | Activity indicator (`size`: `sm`/`md`/`lg`) |
| `StatCard`          | `@components/common/StatCard`          | KPI metric cards                            |
| `ServiceCard`       | `@components/common/ServiceCard`       | Navigation cards linking to app sections    |
| `FloatingActionBar` | `@components/common/FloatingActionBar` | Bulk action bar when rows are selected      |

### `table/` — Table Components

| Component    | Import                         | When to use                                           |
| ------------ | ------------------------------ | ----------------------------------------------------- |
| `DataTable`  | `@components/table/DataTable`  | Typed columns, sorting, row click, footer slot        |
| `Pagination` | `@components/table/Pagination` | Pagination controls (typically as `DataTable` footer) |

---

## Path Aliases

```text
@components/ → src/renderer/components/
@contexts/   → src/renderer/contexts/
@hooks/      → src/renderer/hooks/
@i18n/       → src/renderer/i18n/
@pages/      → src/renderer/pages/
@services/   → src/renderer/services/
@types/      → src/renderer/types/
```

---

## File Naming Conventions

| Type             | Convention       | Example          |
| ---------------- | ---------------- | ---------------- |
| Components       | PascalCase       | `UserCard.tsx`   |
| Hooks            | camelCase        | `useSales.ts`    |
| Page folders     | kebab-case       | `sales-history/` |
| Constants        | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`  |
| Types/Interfaces | PascalCase       | `SaleRecord`     |
