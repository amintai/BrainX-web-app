import { useState } from 'react';
import { QueryState } from '../../../components/QueryState.jsx';
import { ProgressBar } from '../../../components/ProgressBar.jsx';
import { useOnboardingChecklist } from '../api/dashboard.queries.js';
import { ChecklistItem } from './ChecklistItem.jsx';

/** Interactive onboarding checklist; toggles are overrides on top of query data (ADR-8, FR-017). */
export function OnboardingChecklist() {
  const query = useOnboardingChecklist();
  const [overrides, setOverrides] = useState({});

  function handleToggle(id) {
    setOverrides((prev) => {
      const baseItem = query.data?.find((item) => item.id === id);
      const baseCompleted = baseItem?.completed ?? false;
      const current = prev[id] ?? baseCompleted;
      return { ...prev, [id]: !current };
    });
  }

  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <QueryState
        query={query}
        skeleton={<div className="h-64 animate-pulse" aria-hidden="true" />}
        errorMessage="Could not load onboarding checklist."
      >
        {(items) => {
          const resolvedItems = items.map((item) => ({
            ...item,
            completed: overrides[item.id] ?? item.completed,
          }));
          const completedCount = resolvedItems.filter((item) => item.completed).length;
          const pct = Math.round((completedCount / resolvedItems.length) * 100);

          return (
            <>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex flex-col">
                  <h2 className="text-headline-sm text-on-surface">
                    Quick Onboarding &amp; Next Steps
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Complete remaining setup items to achieve full enterprise grade posture.
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-label-md text-secondary font-semibold">
                    {completedCount} of {resolvedItems.length} done
                  </span>
                  <span className="text-body-sm text-outline">{pct}% completed</span>
                </div>
              </div>
              <div className="mb-space-md">
                <ProgressBar value={pct} size="sm" label="Onboarding progress" />
              </div>
              <div className="flex flex-col gap-space-sm">
                {resolvedItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    completed={item.completed}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </>
          );
        }}
      </QueryState>
    </section>
  );
}
