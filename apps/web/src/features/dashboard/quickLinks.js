import { ROUTES } from '../../app/routes.js';

/** Quick-navigation shortcut tiles (FR-019). Only `users` has a `to`. */
export const QUICK_LINKS = [
  {
    key: 'users',
    title: 'User Management',
    description: 'Roles, teams, directory',
    icon: 'manage_accounts',
    to: ROUTES.users,
  },
  {
    key: 'security',
    title: 'Security Settings',
    description: 'MFA, SAML, IP ranges',
    icon: 'lock_person',
  },
  {
    key: 'apiKeys',
    title: 'API Keys & Tokens',
    description: 'OAuth2, Webhooks, keys',
    icon: 'vpn_key',
  },
  {
    key: 'permissions',
    title: 'Team Permissions',
    description: 'Access matrix, policies',
    icon: 'shield',
  },
];
