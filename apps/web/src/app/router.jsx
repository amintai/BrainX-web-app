import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '../features/auth/RequireAuth.jsx';
import { RedirectIfAuthenticated } from '../features/auth/RedirectIfAuthenticated.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { AppShell } from '../features/shell/AppShell.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { UserManagementPage } from '../features/users/UserManagementPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { ROUTES } from './routes.js';

/** Exported separately so tests can build a `createMemoryRouter` from the same tree. */
export const routeConfig = [
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'users', element: <UserManagementPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routeConfig);
