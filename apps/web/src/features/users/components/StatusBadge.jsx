const STATUS_STYLES = {
  active: {
    label: 'Active',
    badgeClass: 'bg-tertiary-fixed/30 text-tertiary-container font-medium',
    dotClass: 'bg-on-tertiary-container',
  },
  pending: {
    label: 'Pending',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed-variant font-medium',
    dotClass: 'bg-secondary',
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-error-container text-on-error-container font-medium',
    dotClass: 'bg-error',
  },
};

/** Status badge + dot, each status with its own literal color pair (FR-024). */
export function StatusBadge({ status }) {
  const { label, badgeClass, dotClass } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm ${badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
