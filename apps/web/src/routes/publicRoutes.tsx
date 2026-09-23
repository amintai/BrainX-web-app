import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './routePaths';
import { useAppSelector } from '../store/hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const status = useAppSelector((state) => state.auth.status);
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirect') || ROUTES.dashboard;

  if (status === 'idle' || status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
