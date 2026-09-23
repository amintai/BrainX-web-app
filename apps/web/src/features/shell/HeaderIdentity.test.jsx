import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { HeaderIdentity } from './HeaderIdentity.jsx';

describe('HeaderIdentity', () => {
  it('renders the derived name, a default role, an avatar, and the chevron', () => {
    renderWithProviders(<HeaderIdentity />, {
      authStatus: 'authenticated',
      user: { email: 'deepti.jakhotra@tntra.io', app_metadata: {}, user_metadata: {} },
    });

    expect(screen.getByText('Deepti Jakhotra')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('is non-interactive: no button role, no aria-haspopup', () => {
    const { container } = renderWithProviders(<HeaderIdentity />, {
      authStatus: 'authenticated',
      user: { email: 'deepti.jakhotra@tntra.io', app_metadata: {}, user_metadata: {} },
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-haspopup]')).not.toBeInTheDocument();
  });
});
