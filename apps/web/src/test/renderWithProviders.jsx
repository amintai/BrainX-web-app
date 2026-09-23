import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import { AuthContext } from '../features/auth/AuthProvider.jsx';

/** A fresh, retry-disabled QueryClient per test (R-13: avoid flaky async retries). */
export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const DEFAULT_USER = {
  id: 'test-user-id',
  email: 'deepti.jakhotra@tntra.io',
  app_metadata: {},
  user_metadata: {},
};

/**
 * Test harness (T006): wraps a component tree in a fresh QueryClient, a
 * router (a plain MemoryRouter around `ui`, or a full `createMemoryRouter`
 * when `routes` is supplied — used by the router-integration tests), and an
 * injectable AuthContext value.
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authStatus = 'authenticated',
    user = authStatus === 'authenticated' ? DEFAULT_USER : null,
    session = authStatus === 'authenticated' ? { user } : null,
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    routes = null,
  } = options;

  const authValue = { session, user, status: authStatus };

  function Tree() {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {routes ? (
            <RouterProvider router={createMemoryRouter(routes, { initialEntries })} />
          ) : (
            <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
          )}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(<Tree />) };
}
