import { WelcomeBanner } from './components/WelcomeBanner.jsx';
import { KpiGrid } from './components/KpiGrid.jsx';
import { OnboardingChecklist } from './components/OnboardingChecklist.jsx';
import { ActivityFeed } from './components/ActivityFeed.jsx';
import { QuickNavigation } from './components/QuickNavigation.jsx';
import { RoleBreakdownCard } from './components/RoleBreakdownCard.jsx';
import { SecurityAdvisoryCard } from './components/SecurityAdvisoryCard.jsx';

/** Dashboard page (FR-014): composition only, no logic of its own. */
export function DashboardPage() {
  return (
    <div className="flex flex-col w-full gap-space-lg">
      <WelcomeBanner />
      <KpiGrid />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <OnboardingChecklist />
          <ActivityFeed />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <QuickNavigation />
          <RoleBreakdownCard />
          <SecurityAdvisoryCard />
        </div>
      </div>
    </div>
  );
}
