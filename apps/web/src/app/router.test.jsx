import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { routeConfig } from './router.jsx';

describe('router integration', () => {
  it('renders AppShell chrome + DashboardPage at / when authenticated', async () => {
    renderWithProviders(null, {
      authStatus: 'authenticated',
      routes: routeConfig,
      initialEntries: ['/'],
    });
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(await screen.findByText('Total Active Users')).toBeInTheDocument();
  });

  it('renders AppShell chrome + UserManagementPage at /users when authenticated', async () => {
    renderWithProviders(null, {
      authStatus: 'authenticated',
      routes: routeConfig,
      initialEntries: ['/users'],
    });
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'User Management' })).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to /login before AppShell mounts, for both routes', () => {
    const atRoot = renderWithProviders(null, {
      authStatus: 'unauthenticated',
      routes: routeConfig,
      initialEntries: ['/'],
    });
    expect(atRoot.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(atRoot.getByText('Welcome back')).toBeInTheDocument();
    atRoot.unmount();

    const atUsers = renderWithProviders(null, {
      authStatus: 'unauthenticated',
      routes: routeConfig,
      initialEntries: ['/users'],
    });
    expect(atUsers.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(atUsers.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders NotFoundPage with no chrome for an unknown path', () => {
    renderWithProviders(null, {
      authStatus: 'authenticated',
      routes: routeConfig,
      initialEntries: ['/does-not-exist'],
    });
    expect(screen.getByText('404 — Page not found')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
  });
});
