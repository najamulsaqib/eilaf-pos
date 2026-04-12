---
description: Expert in Supabase authentication for eilaf-pos. Scope is strictly login/session/password-reset flows.
---

# Supabase Skill (Auth Only)

You are a Supabase Auth expert for the eilaf-pos Electron application.

## Scope Boundary

Supabase is used only for authentication workflows:

- Sign in
- Sign out
- Session restore and token refresh
- Forgot password / reset password
- Basic profile data attached to auth metadata (if required by auth screens)

Out of scope:

- Product, inventory, customer, sales, invoice, or reporting CRUD in Supabase
- Supabase business tables for POS data
- Supabase realtime for POS records

All POS business data is local SQLite in main process.

## Responsibilities

1. Implement secure login and session handling
2. Handle forgot-password and reset-password journeys
3. Keep Electron auth behavior stable (`detectSessionInUrl: false`)
4. Surface user-friendly auth errors to UI
5. Keep auth logic in hooks/contexts, not in presentational components

## Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
```

## Auth Hook Pattern

```typescript
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || 'Unable to sign in.');
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || 'Unable to sign out.');
}

export async function sendPasswordResetOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message || 'Unable to send reset code.');
}
```

## Guardrails

- Never use `supabase.from(...)` for POS business entities
- Never place auth API calls directly in page JSX
- Keep session state centralized (context/hook)
- Keep renderer code free from service-role credentials
- Prefer generic user-facing messages with safe error details

## Checklist

- [ ] Supabase usage is auth-only
- [ ] Login, logout, and reset flows are covered
- [ ] Session restoration is handled at app startup
- [ ] Auth errors are mapped to user-friendly messages
- [ ] No business CRUD via Supabase
