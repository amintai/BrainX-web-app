import { QueryState } from '../../../components/QueryState.jsx';
import { ProgressBar } from '../../../components/ProgressBar.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useDashboardKpis } from '../api/dashboard.queries.js';
import { StatCard } from './StatCard.jsx';
import { TrendPill } from './TrendPill.jsx';

function CardSkeleton() {
  return (
    <div
      className="h-40 rounded-xl bg-surface-container-lowest shadow-xs animate-pulse"
      aria-hidden="true"
    />
  );
}

/** Four KPI stat cards, each with its own footer treatment (FR-016). */
export function KpiGrid() {
  const query = useDashboardKpis();

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      <QueryState
        query={query}
        skeleton={
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        }
        errorMessage="Could not load dashboard metrics."
      >
        {(data) => (
          <>
            <StatCard
              label="Total Active Users"
              value={data.activeUsers.value.toLocaleString('en-US')}
              icon="group"
              iconTone="secondary"
            >
              <TrendPill changePct={data.activeUsers.changePct} />
              <span className="text-body-sm text-outline">vs last month</span>
            </StatCard>

            <StatCard
              label="Workspace Licenses"
              value={`${Math.round((data.licenses.allocated / data.licenses.total) * 100)}%`}
              valueSuffix="used"
              icon="badge"
              iconTone="secondary"
            >
              <div className="w-full flex flex-col gap-space-xs">
                <ProgressBar
                  value={(data.licenses.allocated / data.licenses.total) * 100}
                  label="Workspace license allocation"
                />
                <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
                  <span>{data.licenses.allocated} allocated</span>
                  <span className="text-outline">{data.licenses.total} total</span>
                </div>
              </div>
            </StatCard>

            <StatCard
              label="System Health & Security"
              value={`${data.systemHealth.uptimePct}%`}
              icon="verified_user"
              iconTone="success"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-label-sm text-emerald-800 font-medium">
                All systems nominal
              </span>
              <span className="ml-auto text-body-sm text-outline">
                {data.systemHealth.incidents} incidents
              </span>
            </StatCard>

            <StatCard
              label="Pending Access"
              value={data.pendingAccess.count}
              icon="notification_important"
              iconTone="warning"
            >
              <span className="inline-flex items-center gap-1 text-label-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Requires review
              </span>
              <button
                type="button"
                className="text-label-sm text-secondary hover:underline flex items-center gap-0.5"
              >
                Review <Icon name="arrow_forward" size={14} />
              </button>
            </StatCard>
          </>
        )}
      </QueryState>
    </section>
  );
}
