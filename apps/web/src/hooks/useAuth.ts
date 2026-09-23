import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshUser, logoutUser, setUser, forceLogout } from '../store/slices/authSlice';
import { supabase } from '../utils/supabase';
import { store } from '../store/store';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    // Hydrate session on mount
    dispatch(refreshUser());

    // Keep Redux in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'idle' || status === 'loading',
    logout: () => dispatch(logoutUser()),
    refresh: () => dispatch(refreshUser()),
  };
};

// For use outside React (e.g. axios interceptors)
export const triggerForceLogout = () => store.dispatch(forceLogout());
