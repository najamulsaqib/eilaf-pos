## description: Expert in TailwindCSS for the eilaf-pos application. Handles utility-first styling, semantic tokens, theming, RTL, and responsive design.

# TailwindCSS Skill

You are a TailwindCSS expert for the eilaf-pos Electron application.

## Tailwind Version

**Tailwind 4.x** — configured entirely through `src/renderer/styles.css` using `@theme`, `@layer`, and `@variant`. There is **no `tailwind.config.js`**.

---

## Theming Architecture

eilaf-pos uses **CSS custom property–based semantic tokens** so that every component is theme-aware without any `dark:` variants in component files.

### How it works

```
styles.css @theme      →  defines --color-* variables
                           Tailwind auto-generates bg-*, text-*, border-* utilities
styles.css @layer base →  .dark { } block overrides the same variables
ThemeContext.tsx        →  toggles .dark class on <html>
```

### Rule: No `dark:` in components

**Never write `dark:` variants in component or page files.** Define the dark override in `styles.css` under `.dark { }` instead. This keeps all theming in one place and allows adding new themes (`.sepia`, `.high-contrast`, etc.) with a single CSS block.

```tsx
// WRONG — hardcodes per-theme logic in the component
<div className="bg-white dark:bg-slate-900">

// CORRECT — single semantic class, theme-aware automatically
<div className="bg-surface">
```

### Adding a new theme

1. Add a block in `styles.css` `@layer base` — e.g. `.sepia { --color-surface: #f4ecd8; … }`
2. Add the mode to `TThemeMode` in `src/renderer/contexts/ThemeContext.tsx`
3. Add a picker card in `src/renderer/pages/settings/index.tsx`
4. No component changes needed.

---

## Semantic Token Reference

All tokens live in `src/renderer/styles.css`. Override them per-theme in `@layer base`.

### Surface tokens

| Class               | Light     | Dark      | Usage                          |
| ------------------- | --------- | --------- | ------------------------------ |
| `bg-surface`        | white     | slate-900 | panels, cards, modals          |
| `bg-surface-raised` | slate-50  | slate-800 | page background, hover targets |
| `bg-surface-muted`  | slate-100 | slate-800 | inputs, wells, disabled areas  |

### Border tokens

| Class                | Light     | Dark      | Usage                  |
| -------------------- | --------- | --------- | ---------------------- |
| `border-edge`        | slate-200 | slate-700 | card / divider borders |
| `border-edge-strong` | slate-300 | slate-600 | input borders          |
| `border-edge-muted`  | slate-100 | slate-800 | very subtle borders    |

### Text tokens

| Class            | Light     | Dark      | Usage                         |
| ---------------- | --------- | --------- | ----------------------------- |
| `text-ink`       | slate-900 | slate-100 | primary text                  |
| `text-ink-dim`   | slate-600 | slate-400 | secondary text, labels        |
| `text-ink-faint` | slate-500 | slate-400 | muted text, descriptions      |
| `text-ink-ghost` | slate-400 | slate-600 | placeholders, disabled, icons |

### Interaction token

| Class                                   | Light       | Dark        | Usage                                   |
| --------------------------------------- | ----------- | ----------- | --------------------------------------- |
| `ring-focus-ring` / `border-focus-ring` | primary-500 | primary-400 | keyboard focus rings on inputs/wrappers |

Use with `focus-within:ring-2 focus-within:ring-focus-ring` on wrapper elements, or `focus:ring-2 focus:ring-focus-ring` on interactive elements.

### StatCard accent tokens

Each stat card color has three semantic tokens. Override per theme in `.dark {}`.

| Variant | Border class                | Icon bg class            | Icon text class         |
| ------- | --------------------------- | ------------------------ | ----------------------- |
| green   | `border-stat-green-border`  | `bg-stat-green-icon-bg`  | `text-stat-green-icon`  |
| orange  | `border-stat-orange-border` | `bg-stat-orange-icon-bg` | `text-stat-orange-icon` |
| yellow  | `border-stat-yellow-border` | `bg-stat-yellow-icon-bg` | `text-stat-yellow-icon` |
| red     | `border-stat-red-border`    | `bg-stat-red-icon-bg`    | `text-stat-red-icon`    |
| theme   | `border-stat-theme-border`  | `bg-stat-theme-icon-bg`  | `text-stat-theme-icon`  |
| neon    | `border-stat-neon-border`   | `bg-stat-neon-icon-bg`   | `text-stat-neon-icon`   |

### Brand / primary palette

`primary-50` through `primary-950` — fixed brand color (red tones). Defined once in `@theme`, **not overridden per theme**. Use for CTAs, focus rings, active states.

---

## Layout & RTL

Use **logical properties** everywhere. Physical directional classes break RTL (Urdu) layout.

| Avoid                   | Use                     |
| ----------------------- | ----------------------- |
| `ml-*` / `mr-*`         | `ms-*` / `me-*`         |
| `pl-*` / `pr-*`         | `ps-*` / `pe-*`         |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `left-*` / `right-*`    | `start-*` / `end-*`     |
| `text-left`             | `text-start`            |

---

## Responsive Design

Breakpoints: `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px

Always mobile-first: base classes for small screens, `sm:`/`md:`/`lg:` for larger.

---

## Focus States

Always use `focus-within:ring-focus-ring` (wrapper divs containing inputs) or `focus:ring-focus-ring` (interactive elements directly).

```tsx
// Wrapper pattern (search bar, custom input wrappers)
<div className="… focus-within:ring-2 focus-within:ring-focus-ring focus-within:border-focus-ring">
  <input className="… focus:outline-none" />
</div>

// Direct interactive element
<button className="… focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2">
```

---

## Class Organization

Order: Layout → Spacing → Sizing → Colors/surfaces → Typography → Effects → States

```tsx
<div className="
  flex items-center gap-3          // layout
  px-4 py-3                        // spacing
  bg-surface border border-edge    // colors
  text-sm text-ink                 // typography
  rounded-xl shadow-sm             // effects
  hover:shadow-md transition-shadow // states
">
```

---

## Checklist

- [ ] No `dark:` variants in component files
- [ ] No `bg-white` or `bg-slate-*` — use `bg-surface*`
- [ ] No `text-slate-*` or `text-gray-*` — use `text-ink*`
- [ ] No `border-slate-*` or `border-gray-*` — use `border-edge*`
- [ ] No hardcoded `blue-*` — use `primary-*`
- [ ] No physical direction classes — use logical (`ms-*`, `me-*`)
- [ ] Focus rings use `ring-focus-ring`
- [ ] RTL checked at each breakpoint
