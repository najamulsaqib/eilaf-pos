import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@services/supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<void>;
  completePasswordReset: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Suppresses auth state changes while mid-password-reset so the app
  // doesn't navigate away before the user sets a new password.
  const passwordResetPending = useRef(false);

  useEffect(() => {
    let subscription: { unsubscribe(): void };

    (async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        if (passwordResetPending.current) return;
        setSession(next);
      });
      subscription = data.subscription;
    })();

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Unable to sign in.');
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sendPasswordResetOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(error.message || 'Unable to send reset code.');
  }, []);

  const verifyPasswordResetOtp = useCallback(
    async (email: string, token: string) => {
      passwordResetPending.current = true;
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        passwordResetPending.current = false;
        throw new Error(error.message || 'Invalid or expired code.');
      }
    },
    [],
  );

  const completePasswordReset = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message || 'Failed to update password.');
    passwordResetPending.current = false;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn,
      signOut,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      completePasswordReset,
    }),
    [
      session,
      loading,
      signIn,
      signOut,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      completePasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
