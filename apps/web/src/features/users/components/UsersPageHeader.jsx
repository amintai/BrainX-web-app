/** Breadcrumb, title, and description (FR-022). */
export function UsersPageHeader() {
  return (
    <div className="flex flex-col gap-space-xs pb-space-lg">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-space-xs text-code-md font-mono text-on-surface-variant uppercase tracking-wider"
      >
        <span>Organization</span>
        <span>/</span>
        <span className="text-secondary font-semibold">Access Control</span>
      </nav>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <h1 className="text-headline-lg text-on-surface tracking-tight">User Management</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Manage team members, roles, permissions, and access status across your organization.
          </p>
        </div>
      </div>
    </div>
  );
}
