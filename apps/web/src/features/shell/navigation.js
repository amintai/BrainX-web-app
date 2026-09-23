import { ROUTES } from '../../app/routes.js';

/** Primary sidebar nav config (FR-008). Dashboard's `end: true` is mandatory (FR-009, R-6). */
export const PRIMARY_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home', to: ROUTES.dashboard, end: true },
  { key: 'users', label: 'User Management', icon: 'group', to: ROUTES.users },
  { key: 'analytics', label: 'Analytics', icon: 'bar_chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

/** Pinned footer group (FR-008, FR-011). Logout is wired to `useSignOut` in `Sidebar`. */
export const FOOTER_NAV = [
  { key: 'support', label: 'Support', icon: 'help' },
  { key: 'logout', label: 'Logout', icon: 'logout' },
];
