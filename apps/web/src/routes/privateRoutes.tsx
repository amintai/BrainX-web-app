import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './routePaths';
import { useAppSelector } from '../store/hooks';
import SidebarLayout from '../layouts/SidebarLayout';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const status = useAppSelector((state) => state.auth.status);
  const role = useAppSelector((state) => state.auth.user?.app_metadata?.role as string | undefined);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={`${ROUTES.login}?redirect=${location.pathname}`} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={ROUTES.unauthorized} replace />;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
};

export default PrivateRoute;
