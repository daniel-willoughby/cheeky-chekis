import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  userId: string | null;
  loading: boolean;
  recovering: boolean; // arrived via a password-reset link; show the set-new-password screen
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Clicking a reset link signs the user into a temporary recovery session
      // and fires PASSWORD_RECOVERY — show the set-new-password screen instead
      // of the app until they choose a new password.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? (error.message || 'Could not log in. Please try again.') : null };
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: error.message || 'Could not create your account. Please try again.', needsConfirm: false };
    // With email confirmation disabled, signUp returns a live session and the
    // user is logged straight in. With it enabled, there's a user but no
    // session, so we ask them to confirm by email.
    return { error: null, needsConfirm: !data.session };
  }

  async function requestPasswordReset(email: string) {
    const redirectTo = window.location.origin + import.meta.env.BASE_URL;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    return { error: error ? (error.message || 'Could not send the reset email. Please try again.') : null };
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message || 'Could not update your password. Please try again.' };
    setRecovering(false);
    return { error: null };
  }

  async function signOut() {
    setRecovering(false);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userId: session?.user.id ?? null,
        loading,
        recovering,
        signIn,
        signUp,
        requestPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
