import { describe, it, expect } from 'vitest';
import * as fixtures from './dashboard.fixtures.js';
import {
  fetchDashboardKpis,
  fetchRecentActivity,
  fetchRoleBreakdown,
  fetchOnboardingChecklist,
} from './dashboard.api.js';

describe('dashboard fetchers', () => {
  it('resolve clones, not the same fixture reference, and do not mutate the original on mutation', async () => {
    const kpis = await fetchDashboardKpis();
    expect(kpis).toEqual(fixtures.kpis);
    expect(kpis).not.toBe(fixtures.kpis);

    kpis.activeUsers.value = 999;
    const kpisAgain = await fetchDashboardKpis();
    expect(kpisAgain.activeUsers.value).toBe(fixtures.kpis.activeUsers.value);
  });

  it('resolve valid schema-parsed activity, role breakdown, and onboarding data', async () => {
    await expect(fetchRecentActivity()).resolves.toHaveLength(4);
    await expect(fetchRoleBreakdown()).resolves.toEqual(fixtures.roleBreakdown);
    await expect(fetchOnboardingChecklist()).resolves.toHaveLength(4);
  });
});
