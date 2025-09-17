/**
 * AuthProvider.tsx – React context wrapper for Supabase auth
 * ------------------------------------------------------------------
 * Purpose
 *  - Single source of truth for auth state (user, loading, error)
 *  - Exposes typed sign-in / sign-up / sign-out helpers
 *  - Handles the “session loading” gap so UI can show a spinner
 *
 * Usage
 *  1. Wrap root layout with <AuthProvider>
 *  2. Any screen: const { user, loading, error, signIn, signUp, signOut } = useAuth()
 *
 * Key concepts
 *  - “loading” = waiting for Supabase to verify stored tokens (cold start / reload)
 *  - “error” = last async auth failure (network, wrong password, etc.)
 *  - All methods both throw (for try/catch) and set error string (for UI)
 */

import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../apps/expo/lib/supabase';

/* -------------------- Types ------------------------------------- */
type AuthContextType = {
  user: User | null;
  loading: boolean; // true while verifying stored tokens
  error: string | null; // last auth failure, cleared on next action
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/* -------------------- Context ----------------------------------- */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* -------------------- Provider ---------------------------------- */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // cold-start check
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    setError(msg);
    throw e;
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      handleError(error);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      handleError(error);
    }
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      handleError(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/* -------------------- Hook -------------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
