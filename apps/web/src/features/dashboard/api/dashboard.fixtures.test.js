import { describe, it, expect } from 'vitest';
import { kpis, activity, roleBreakdown, onboardingChecklist } from './dashboard.fixtures.js';
import {
  kpisSchema,
  activityListSchema,
  roleBreakdownSchema,
  onboardingChecklistSchema,
} from './dashboard.schemas.js';

describe('dashboard fixtures satisfy their schemas', () => {
  it('kpis', () => {
    expect(() => kpisSchema.parse(kpis)).not.toThrow();
  });

  it('activity', () => {
    expect(() => activityListSchema.parse(activity)).not.toThrow();
  });

  it('roleBreakdown, summing to 2845', () => {
    const parsed = roleBreakdownSchema.parse(roleBreakdown);
    const total = parsed.roles.reduce((sum, role) => sum + role.count, 0);
    expect(total).toBe(2845);
  });

  it('onboardingChecklist', () => {
    expect(() => onboardingChecklistSchema.parse(onboardingChecklist)).not.toThrow();
  });
});
