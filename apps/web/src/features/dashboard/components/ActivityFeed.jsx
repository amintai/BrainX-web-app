import { QueryState } from '../../../components/QueryState.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useRecentActivity } from '../api/dashboard.queries.js';
import { ActivityFeedItem } from './ActivityFeedItem.jsx';

/** Recent organization activity feed (FR-018). */
export function ActivityFeed() {
  const query = useRecentActivity();

  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-space-md">
        <div className="flex items-center gap-space-xs">
          <Icon name="history" size={22} className="text-secondary" />
          <h2 className="text-headline-sm text-on-surface">Recent Organization Activity</h2>
        </div>
        <button type="button" className="text-label-md text-secondary hover:underline">
          View Full Log
        </button>
      </div>
      <QueryState
        query={query}
        skeleton={<div className="h-48 animate-pulse" aria-hidden="true" />}
        errorMessage="Could not load recent activity."
      >
        {(entries) => (
          <div className="flex flex-col divide-y divide-surface-container-high/60">
            {entries.map((entry) => (
              <ActivityFeedItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </QueryState>
    </section>
  );
}
