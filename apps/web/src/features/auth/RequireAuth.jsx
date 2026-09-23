import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth.js';

/**
 * Layout route: redirects to /login when there is no authenticated session.
 */
export function RequireAuth() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
