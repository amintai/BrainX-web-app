import * as fixtures from './dashboard.fixtures.js';
import {
  kpisSchema,
  activityListSchema,
  roleBreakdownSchema,
  onboardingChecklistSchema,
} from './dashboard.schemas.js';

/**
 * Mock fetchers (ADR-5, swap points). Each resolves a deep clone of the
 * fixture (no shared-reference mutation across calls/tests) and Zod-parses
 * it, so a future real endpoint that drifts from the contract surfaces as a
 * handled query error instead of a render crash.
 */
export async function fetchDashboardKpis() {
  return kpisSchema.parse(structuredClone(fixtures.kpis));
}

export async function fetchRecentActivity() {
  return activityListSchema.parse(structuredClone(fixtures.activity));
}

export async function fetchRoleBreakdown() {
  return roleBreakdownSchema.parse(structuredClone(fixtures.roleBreakdown));
}

export async function fetchOnboardingChecklist() {
  return onboardingChecklistSchema.parse(structuredClone(fixtures.onboardingChecklist));
}
