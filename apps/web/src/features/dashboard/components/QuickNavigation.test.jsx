import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { QuickNavigation } from './QuickNavigation.jsx';

describe('QuickNavigation', () => {
  it('navigates to /users when the User Management tile is clicked', () => {
    renderWithProviders(<QuickNavigation />, {
      authStatus: 'authenticated',
      initialEntries: ['/'],
    });
    fireEvent.click(screen.getByText('User Management'));
    // Link navigation inside a bare MemoryRouter (no matching routes) will not
    // throw; assert the anchor points at /users.
    expect(screen.getByText('User Management').closest('a')).toHaveAttribute('href', '/users');
  });

  it('does not navigate for the other 3 tiles (rendered as inert buttons)', () => {
    renderWithProviders(<QuickNavigation />, { authStatus: 'authenticated' });
    const security = screen.getByText('Security Settings').closest('button');
    const apiKeys = screen.getByText('API Keys & Tokens').closest('button');
    const permissions = screen.getByText('Team Permissions').closest('button');
    expect(security).toBeInTheDocument();
    expect(apiKeys).toBeInTheDocument();
    expect(permissions).toBeInTheDocument();
    expect(() => {
      fireEvent.click(security);
      fireEvent.click(apiKeys);
      fireEvent.click(permissions);
    }).not.toThrow();
  });
});
