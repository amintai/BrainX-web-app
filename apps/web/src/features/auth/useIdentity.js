import { useMemo } from 'react';
import { useAuth } from './useAuth.js';
import { deriveIdentity } from './identity.js';

/** `useAuth()` + a memoised `deriveIdentity` call (recomputes only when `user` changes). */
export function useIdentity() {
  const { user } = useAuth();
  return useMemo(() => deriveIdentity(user), [user]);
}
