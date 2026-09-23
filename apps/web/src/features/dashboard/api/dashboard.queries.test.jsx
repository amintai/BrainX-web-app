import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { dashboardKeys, useDashboardKpis, useOnboardingChecklist } from './dashboard.queries.js';

function Probe() {
  const kpis = useDashboardKpis();
  const onboarding = useOnboardingChecklist();
  if (!kpis.data || !onboarding.data) return <div>loading</div>;
  return (
    <div>
      <span>kpis:{kpis.data.activeUsers.value}</span>
      <span>onboarding:{onboarding.data.length}</span>
    </div>
  );
}

describe('dashboard query keys', () => {
  it('are namespaced under "dashboard"', () => {
    expect(dashboardKeys.kpis()).toEqual(['dashboard', 'kpis']);
    expect(dashboardKeys.activity()).toEqual(['dashboard', 'activity']);
    expect(dashboardKeys.roleBreakdown()).toEqual(['dashboard', 'role-breakdown']);
    expect(dashboardKeys.onboarding()).toEqual(['dashboard', 'onboarding']);
  });
});

describe('dashboard query hooks', () => {
  it('resolve fixture-shaped data', async () => {
    renderWithProviders(<Probe />, { authStatus: 'authenticated' });
    expect(await screen.findByText('kpis:2845')).toBeInTheDocument();
    expect(await screen.findByText('onboarding:4')).toBeInTheDocument();
  });
});
