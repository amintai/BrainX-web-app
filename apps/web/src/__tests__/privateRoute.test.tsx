import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../store/slices/authSlice';
import PrivateRoute from '../routes/privateRoutes';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, status: 'authenticated', isAuthenticated: true, isLoading: false }),
}));

vi.mock('../layouts/SidebarLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const memberUser = {
  id: 'u1',
  email: 'member@test.com',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const adminUser = {
  ...memberUser,
  id: 'u2',
  email: 'admin@test.com',
  app_metadata: { role: 'admin' },
};

function makeStore(user: typeof memberUser | null, status: string) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: user as never, status: status as never },
    },
  });
}

function renderWithRoute(store: ReturnType<typeof makeStore>, requiredRole?: string) {
  const qc = new QueryClient();
  return render(
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <PrivateRoute requiredRole={requiredRole}>
                  <div data-testid="protected-content">Protected</div>
                </PrivateRoute>
              }
            />
            <Route
              path="/unauthorized"
              element={<div data-testid="unauthorized">Unauthorized</div>}
            />
            <Route path="/" element={<div data-testid="login">Login</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('PrivateRoute role enforcement', () => {
  it('redirects non-admin to /unauthorized when requiredRole is admin', () => {
    const store = makeStore(memberUser, 'authenticated');
    renderWithRoute(store, 'admin');
    expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children for admin user when requiredRole is admin', () => {
    const store = makeStore(adminUser, 'authenticated');
    renderWithRoute(store, 'admin');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument();
  });

  it('renders children when no requiredRole specified', () => {
    const store = makeStore(memberUser, 'authenticated');
    renderWithRoute(store, undefined);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
