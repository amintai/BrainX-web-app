import { lazy } from 'react';
import { ROUTES } from './routePaths';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const CallbackPage = lazy(() => import('../pages/auth/CallbackPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
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
  { path: ROUTES.signup, component: SignupPage },
  { path: ROUTES.forgotPassword, component: ForgotPasswordPage },
  { path: ROUTES.resetPassword, component: ResetPasswordPage },
  { path: ROUTES.authCallback, component: CallbackPage },
  { path: ROUTES.unauthorized, component: UnauthorizedPage },
];

export const PrivateRouteList: PrivateRouteConfig[] = [
  { path: ROUTES.dashboard, component: DashboardPage, pageTitle: 'Dashboard', group: 'OVERVIEW' },
  { path: ROUTES.profile, component: ProfilePage, pageTitle: 'Profile', group: 'ACCOUNT' },
  { path: ROUTES.users, component: UsersPage, pageTitle: 'Users', group: 'ADMIN' },
];

export { NotFoundPage };
