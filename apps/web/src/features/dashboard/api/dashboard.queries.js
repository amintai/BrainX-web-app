import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardKpis,
  fetchRecentActivity,
  fetchRoleBreakdown,
  fetchOnboardingChecklist,
} from './dashboard.api.js';

export const dashboardKeys = {
  all: ['dashboard'],
  kpis: () => [...dashboardKeys.all, 'kpis'],
  activity: () => [...dashboardKeys.all, 'activity'],
  roleBreakdown: () => [...dashboardKeys.all, 'role-breakdown'],
  onboarding: () => [...dashboardKeys.all, 'onboarding'],
};

export function useDashboardKpis() {
  return useQuery({ queryKey: dashboardKeys.kpis(), queryFn: fetchDashboardKpis });
}

export function useRecentActivity() {
  return useQuery({ queryKey: dashboardKeys.activity(), queryFn: fetchRecentActivity });
}

export function useRoleBreakdown() {
  return useQuery({ queryKey: dashboardKeys.roleBreakdown(), queryFn: fetchRoleBreakdown });
}

export function useOnboardingChecklist() {
  return useQuery({ queryKey: dashboardKeys.onboarding(), queryFn: fetchOnboardingChecklist });
}
