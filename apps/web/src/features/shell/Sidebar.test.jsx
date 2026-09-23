import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

import { supabase } from '../../lib/supabase.js';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { Sidebar } from './Sidebar.jsx';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 4 primary nav items and Support/Logout in a separate footer group', () => {
    renderWithProviders(<Sidebar />, { authStatus: 'authenticated' });

    const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
    const primaryItems = [...primaryNav.querySelectorAll('a, button')];
    const labels = primaryItems.map((item) => item.querySelector('span:last-child').textContent);
    expect(labels).toEqual(['Dashboard', 'User Management', 'Analytics', 'Settings']);

    const footerNav = screen.getByRole('navigation', { name: 'Account' });
    expect(within(footerNav).getByText('Support')).toBeInTheDocument();
    expect(within(footerNav).getByText('Logout')).toBeInTheDocument();
  });

  it('calls supabase.auth.signOut when Logout is clicked, and disables it while pending', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });
    renderWithProviders(<Sidebar />, { authStatus: 'authenticated' });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(logoutButton).toBeDisabled();
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledTimes(1));
  });
});
