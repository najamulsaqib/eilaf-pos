# eilaf-pos (Electron + React + SQLite)

eilaf-pos is a desktop point-of-sale application built with Electron and React.

## Tech Stack

- Electron
- React 19 + TypeScript
- SQLite (`better-sqlite3`) for local business data
- Supabase Auth for login/session/password reset only
- React Query
- TailwindCSS

## Architecture Standards

### 1) Data ownership

- POS business data is local-first and stored in SQLite
- SQLite access is only allowed in `src/main/db/`
- Renderer (`src/renderer/`) must never import `better-sqlite3`

### 2) Process boundary

Data flow is always:

1. Renderer pages/components
2. Hooks/services
3. Preload bridge (`window.electron.*`)
4. IPC handlers in `src/main/ipc/`
5. SQLite repositories in `src/main/db/`

### 3) Supabase policy

Supabase is restricted to authentication only:

- Sign in
- Sign out
- Session lifecycle
- Forgot/reset password

Supabase must not be used for POS business CRUD.

### 4) UI standards

- Use existing components from `src/renderer/components/`
- Do not use native `<select>` for app selects; use `SelectField`
- Use `Button`, `IconButton`, or `DropdownMenu` for actions
- Use `@heroicons/react` for icons

## Project Standards Files

- Core standards: [.instructions.md](.instructions.md)
- Agent/project context: [CLAUDE.md](CLAUDE.md)
- Skills:
  - [.github/copilot/skills/sqlite.md](.github/copilot/skills/sqlite.md)
  - [.github/copilot/skills/supabase.md](.github/copilot/skills/supabase.md)
  - [.github/copilot/skills/data-layer.md](.github/copilot/skills/data-layer.md)
  - [.github/copilot/skills/react.md](.github/copilot/skills/react.md)
  - [.github/copilot/skills/electron.md](.github/copilot/skills/electron.md)
  - [.github/copilot/skills/tailwindcss.md](.github/copilot/skills/tailwindcss.md)

## Scripts

```bash
npm start
npm run build
npm run test
```

## Notes

- Keep business persistence in SQLite repositories and IPC.
- Keep Supabase logic isolated to auth-related hooks/contexts.
- Follow folder-based page routing and shared UI component usage.
