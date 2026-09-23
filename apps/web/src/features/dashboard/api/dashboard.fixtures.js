/**
 * Domain data only — no Tailwind classes, no icon names (those live in
 * component-level literal maps so a real backend never sends presentation
 * data). `occurredAt` is computed relative to `Date.now()` at module load
 * (R-15) so the relative-time labels always read like the Stitch design.
 */
const now = Date.now();
const minutes = (n) => new Date(now - n * 60 * 1000).toISOString();
const hours = (n) => new Date(now - n * 60 * 60 * 1000).toISOString();

export const kpis = {
  activeUsers: { value: 2845, changePct: 12.4 },
  licenses: { allocated: 255, total: 300 },
  systemHealth: { uptimePct: 99.98, incidents: 0, status: 'nominal' },
  pendingAccess: { count: 14 },
};

export const activity = [
  {
    id: 'activity-1',
    actor: { name: 'Elena Rostova', kind: 'user', avatarUrl: null },
    summary: 'generated a new Production API Token for',
    target: { label: 'billing-service-worker', format: 'code' },
    occurredAt: minutes(8),
    category: 'secops',
    type: 'token-created',
  },
  {
    id: 'activity-2',
    actor: { name: 'Marcus Chen', kind: 'user', avatarUrl: null },
    summary: 'approved access for 4 team members into',
    target: { label: 'data-warehouse-read', format: 'code' },
    occurredAt: minutes(42),
    category: 'access-control',
    type: 'access-approved',
  },
  {
    id: 'activity-3',
    actor: { name: 'System Daemon', kind: 'system', avatarUrl: null },
    summary: 'completed automated key rotation across 8 microservices',
    target: null,
    occurredAt: hours(2),
    category: 'automation',
    type: 'key-rotation',
  },
  {
    id: 'activity-4',
    actor: { name: 'Sarah Jenkins', kind: 'user', avatarUrl: null },
    summary: 'modified organization role schema:',
    target: { label: 'Editor rights now include sandbox export', format: 'emphasis' },
    occurredAt: hours(4),
    category: 'governance',
    type: 'role-schema-changed',
  },
];

export const roleBreakdown = {
  roles: [
    { key: 'admins', label: 'Admins', count: 285 },
    { key: 'editors', label: 'Editors', count: 853 },
    { key: 'viewers', label: 'Viewers', count: 1707 },
  ],
};

export const onboardingChecklist = [
  {
    id: 'sso-saml',
    title: 'Configure SSO & SAML Federation',
    description: 'Okta and Azure AD integration mapped successfully',
    completed: true,
    actionLabel: 'Configure',
  },
  {
    id: 'invite-leads',
    title: 'Invite Core Engineering Leads',
    description: '12 team anchors added across Platform & SecOps',
    completed: true,
    actionLabel: 'Invite',
  },
  {
    id: 'rbac',
    title: 'Set Granular Role-Based Permissions',
    description: 'Restrict workspace data mutation rights for tier-2 operators',
    completed: false,
    actionLabel: 'Configure',
  },
  {
    id: 'soc2-review',
    title: 'Review SOC2 & ISO Compliance Checklists',
    description: 'Quarterly automated evidence sync waiting for admin signoff',
    completed: false,
    actionLabel: 'Review',
  },
];
