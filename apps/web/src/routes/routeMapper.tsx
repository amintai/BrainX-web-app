import { lazy } from 'react';
import { ROUTES } from './routePaths';
import { ROLE_ADMIN } from '@brainx/shared';
import OnboardingLayout from '../layouts/OnboardingLayout';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const CallbackPage = lazy(() => import('../pages/auth/CallbackPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const OnboardingPage = lazy(() => import('../pages/onboarding/OnboardingPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
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
  requiredRole?: string;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
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
  {
    path: ROUTES.onboarding,
    component: OnboardingPage,
    pageTitle: 'Get Started',
    layout: OnboardingLayout,
  },
  { path: ROUTES.dashboard, component: DashboardPage, pageTitle: 'Dashboard', group: 'OVERVIEW' },
  { path: ROUTES.profile, component: ProfilePage, pageTitle: 'Profile', group: 'ACCOUNT' },
  { path: ROUTES.settings, component: SettingsPage, pageTitle: 'Settings', group: 'ACCOUNT' },
  {
    path: ROUTES.users,
    component: UsersPage,
    pageTitle: 'Users',
    group: 'ADMIN',
    requiredRole: ROLE_ADMIN,
  },
];

export { NotFoundPage };
