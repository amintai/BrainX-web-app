import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { DashboardPage } from './DashboardPage.jsx';

describe('DashboardPage', () => {
  it('renders all 7 sections together with every query resolved', async () => {
    renderWithProviders(<DashboardPage />, {
      authStatus: 'authenticated',
      user: { email: 'deepti.jakhotra@tntra.io', app_metadata: {}, user_metadata: {} },
    });

    expect(await screen.findByText('Welcome back, Deepti!', { exact: false })).toBeInTheDocument();
    expect(await screen.findByText('Total Active Users')).toBeInTheDocument();
    expect(await screen.findByText('Quick Onboarding & Next Steps')).toBeInTheDocument();
    expect(await screen.findByText('Recent Organization Activity')).toBeInTheDocument();
    expect(await screen.findByText('Quick Navigation')).toBeInTheDocument();
    expect(await screen.findByText('Users by Role')).toBeInTheDocument();
    expect(await screen.findByText('Enterprise Security Guarantee')).toBeInTheDocument();
  });
});
