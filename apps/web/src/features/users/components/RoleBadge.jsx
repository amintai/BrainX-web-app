const ROLE_STYLES = {
  administrator: {
    label: 'Administrator',
    className: 'bg-primary-container text-primary-fixed-dim',
  },
  manager: { label: 'Manager', className: 'bg-surface-container-high text-secondary font-medium' },
  member: {
    label: 'Member',
    className: 'bg-surface-container text-on-surface-variant font-medium',
  },
  guest: { label: 'Guest', className: 'bg-surface-container-high text-on-surface font-medium' },
};

/** Role badge with a literal class map (no interpolated class names, ADR-2). */
export function RoleBadge({ role }) {
  const { label, className } = ROLE_STYLES[role];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm ${className}`}
    >
      {label}
    </span>
  );
}
