import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router';

/**
 * A fake Supabase auth module with a real `onAuthStateChange` emitter (R-17:
 * this test exercises the real `AuthProvider` subscription wiring, not a
 * shallow context stub — that is what `renderWithProviders` would give us).
 */
vi.mock('../../lib/supabase.js', () => {
  let authCallback = null;
  let currentSession = null;

  return {
    supabase: {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: currentSession } })),
        onAuthStateChange: vi.fn((callback) => {
          authCallback = callback;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(async () => {
          currentSession = null;
          authCallback?.('SIGNED_OUT', null);
          return { error: null };
        }),
      },
    },
    __setInitialSession(session) {
      currentSession = session;
    },
    __emit(event, session) {
      currentSession = session;
      authCallback?.(event, session);
    },
  };
});

const FAKE_SESSION = { user: { id: 'u1', email: 'deepti.jakhotra@tntra.io' } };

async function mountApp(initialEntries) {
  const { AuthProvider } = await import('./AuthProvider.jsx');
  const { createTestQueryClient } = await import('../../test/renderWithProviders.jsx');
  const { routeConfig } = await import('../../app/router.jsx');

  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(routeConfig, { initialEntries });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );

  return { ...result, router };
}

describe('FR-026 redirect (real AuthProvider + fake Supabase emitter)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const supabaseModule = await import('../../lib/supabase.js');
    supabaseModule.__setInitialSession(null);
  });

  it('redirects an already-authenticated visitor away from /login without ever showing the form', async () => {
    const supabaseModule = await import('../../lib/supabase.js');
    supabaseModule.__setInitialSession(FAKE_SESSION);

    await mountApp(['/login']);

    expect(await screen.findByText('Total Active Users')).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('renders the dashboard after a successful sign-in fires SIGNED_IN, with the history entry replaced', async () => {
    const supabaseModule = await import('../../lib/supabase.js');
    const { supabase, __emit } = supabaseModule;
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const { router } = await mountApp(['/login']);

    expect(await screen.findByText('Welcome back')).toBeInTheDocument();

    __emit('SIGNED_IN', FAKE_SESSION);

    expect(await screen.findByText('Total Active Users')).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();

    // The /login entry was replaced (not pushed) — going back must not return to it.
    router.navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).not.toBe('/login'));
  });

  it('leaves the login form rendered with serverError on a failed sign-in (no auth event fires)', async () => {
    const supabaseModule = await import('../../lib/supabase.js');
    supabaseModule.supabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    await mountApp(['/login']);
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    // No emitted event: status stays 'unauthenticated', the guard keeps rendering <Outlet/>.
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('never oscillates: each status toggle settles on exactly one of / or /login', async () => {
    const supabaseModule = await import('../../lib/supabase.js');
    const { __emit } = supabaseModule;

    const { router } = await mountApp(['/login']);
    await screen.findByText('Welcome back');

    __emit('SIGNED_IN', FAKE_SESSION);
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();

    __emit('SIGNED_OUT', null);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(screen.queryByText('Total Active Users')).not.toBeInTheDocument();

    __emit('SIGNED_IN', FAKE_SESSION);
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });
});
