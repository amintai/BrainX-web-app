export const ROLE_ADMIN = 'admin' as const;
export const ROLE_MANAGER = 'manager' as const;
export const ROLE_MEMBER = 'member' as const;

export const ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_MEMBER] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};
