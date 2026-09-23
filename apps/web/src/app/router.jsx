import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '../features/auth/RequireAuth.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);
