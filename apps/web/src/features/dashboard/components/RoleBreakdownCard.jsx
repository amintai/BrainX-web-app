import { Icon } from '../../../components/Icon.jsx';
import { QueryState } from '../../../components/QueryState.jsx';
import { formatNumber, formatPercent } from '../../../lib/format.js';
import { useRoleBreakdown } from '../api/dashboard.queries.js';
import { computeDonutSegments } from '../lib/donut.js';
import { DonutChart } from './DonutChart.jsx';

const ROLE_STYLES = {
  admins: { swatchClass: 'bg-primary', strokeClass: 'text-primary' },
  editors: { swatchClass: 'bg-primary-fixed-dim', strokeClass: 'text-primary-fixed-dim' },
  viewers: { swatchClass: 'bg-secondary', strokeClass: 'text-secondary' },
};

/** Users-by-role donut + legend, in fixture order (Admins, Editors, Viewers) (FR-020). */
export function RoleBreakdownCard() {
  const query = useRoleBreakdown();

  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-xs flex flex-col">
      <QueryState
        query={query}
        skeleton={
          <>
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="text-headline-sm text-on-surface">Users by Role</h2>
            </div>
            <div className="h-36 animate-pulse" aria-hidden="true" />
          </>
        }
        errorMessage="Could not load role breakdown."
      >
        {(data) => {
          const total = data.roles.reduce((sum, role) => sum + role.count, 0);
          const fractions = computeDonutSegments(data.roles.map((role) => role.count));
          const donutSegments = [...data.roles].reverse().map((role) => ({
            key: role.key,
            value: role.count,
            strokeClass: ROLE_STYLES[role.key].strokeClass,
          }));

          return (
            <>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex flex-col">
                  <h2 className="text-headline-sm text-on-surface">Users by Role</h2>
                  <span className="text-body-sm text-outline">
                    Distribution across active licenses
                  </span>
                </div>
                <span className="text-label-md text-on-surface font-semibold">
                  {formatNumber(total)} total
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-lg py-space-sm">
                <DonutChart segments={donutSegments} ariaLabel="Users by role distribution" />
                <div className="flex flex-col gap-space-sm w-full">
                  {data.roles.map((role, index) => (
                    <div
                      key={role.key}
                      className="flex items-center justify-between p-space-xs rounded-xs bg-surface-container-low"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-xs ${ROLE_STYLES[role.key].swatchClass}`}
                        />
                        <span className="text-label-md text-on-surface">{role.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-code-md font-mono font-semibold text-on-surface">
                          {formatNumber(role.count)}
                        </span>
                        <span className="text-body-sm text-outline">
                          {formatPercent(fractions[index].fraction)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-space-sm pt-space-sm border-t border-surface-container flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant">
                  SSO sync executed 14 mins ago
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-label-sm text-secondary hover:underline"
                >
                  <Icon name="sync" size={14} /> Force Sync
                </button>
              </div>
            </>
          );
        }}
      </QueryState>
    </section>
  );
}
