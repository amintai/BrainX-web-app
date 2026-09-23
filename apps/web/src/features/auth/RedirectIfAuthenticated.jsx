import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth.js';
import { ROUTES } from '../../app/routes.js';

/**
 * Layout route: redirects to the dashboard when there IS an authenticated
 * session (FR-026, ADR-12). Structurally the byte-for-byte inverse of
 * `RequireAuth.jsx`'s condition table:
 *
 *   status            | RequireAuth              | RedirectIfAuthenticated
 *   ------------------|---------------------------|--------------------------
 *   'loading'         | null                      | null
 *   'unauthenticated' | <Navigate to="/login" />  | <Outlet/>
 *   'authenticated'   | <Outlet/>                 | <Navigate to="/" />
 *
 * No side effects, no imperative navigation — this is the only redirect
 * mechanism for FR-026 (see ADR-12: LoginPage never calls navigate()).
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
