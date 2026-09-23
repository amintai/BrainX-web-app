import { createContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export const AuthContext = createContext(undefined);

/**
 * Single owner of the Supabase session (ADR-8). Subscribes to
 * onAuthStateChange and exposes { session, user, status } via context.
 * `apiClient` reads the token at request time from supabase-js directly —
 * this provider exists for rendering decisions (RequireAuth, nav, etc.).
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ session: null, user: null, status: 'loading' });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        status: data.session ? 'authenticated' : 'unauthenticated',
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
