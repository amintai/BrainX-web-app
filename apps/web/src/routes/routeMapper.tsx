import { lazy } from 'react';
import { ROUTES } from './routePaths';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const CallbackPage = lazy(() => import('../pages/auth/CallbackPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

export interface PublicRouteConfig {
  path: string;
  component: React.ComponentType;
}

export interface PrivateRouteConfig {
  path: string;
  component: React.ComponentType;
  pageTitle: string;
  group?: string;
}

export const PublicRouteList: PublicRouteConfig[] = [
  { path: ROUTES.login, component: LoginPage },
  { path: ROUTES.authCallback, component: CallbackPage },
  { path: ROUTES.unauthorized, component: UnauthorizedPage },
];

export const PrivateRouteList: PrivateRouteConfig[] = [
  { path: ROUTES.dashboard, component: DashboardPage, pageTitle: 'Dashboard', group: 'OVERVIEW' },
];

export { NotFoundPage };
