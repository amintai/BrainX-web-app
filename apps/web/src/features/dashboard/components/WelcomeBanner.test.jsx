import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { WelcomeBanner } from './WelcomeBanner.jsx';

describe('WelcomeBanner', () => {
  it('renders "Welcome back, Deepti!" and inert action buttons', () => {
    renderWithProviders(<WelcomeBanner />, {
      authStatus: 'authenticated',
      user: { email: 'deepti.jakhotra@tntra.io', app_metadata: {}, user_metadata: {} },
    });

    expect(screen.getByRole('heading')).toHaveTextContent('Welcome back, Deepti!');

    const auditButton = screen.getByRole('button', { name: /view audit log/i });
    const inviteButton = screen.getByRole('button', { name: /invite team member/i });
    expect(auditButton).toHaveAttribute('type', 'button');
    expect(inviteButton).toHaveAttribute('type', 'button');
    expect(() => fireEvent.click(auditButton)).not.toThrow();
    expect(() => fireEvent.click(inviteButton)).not.toThrow();
  });
});
