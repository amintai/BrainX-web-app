import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { queryClient } from '../../app/queryClient.js';

/**
 * Logout (ADR-10, FR-011). Falls back to a local-scope sign-out if the
 * network revoke fails, then always clears the query cache so no data from
 * this session survives for the next user of the machine.
 */
export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      try {
        const result = await supabase.auth.signOut();
        if (result?.error) {
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } finally {
      queryClient.clear();
      setIsSigningOut(false);
    }
  }

  return { signOut, isSigningOut };
}
