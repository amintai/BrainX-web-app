import { useAppSelector } from '../../store/hooks';
import { useApiQuery } from '../../hooks/useApiQuery';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import type { ApiSuccess } from '@brainx/shared';
import { ROLE_ADMIN } from '@brainx/shared';
import MetricCard from '../../components/dashboard/MetricCard';
import RoleChart from '../../components/dashboard/RoleChart';

interface StatsData {
  userCount: number;
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.app_metadata?.role === ROLE_ADMIN;

  const { data, isLoading, isError } = useApiQuery<StatsData>(
    ['stats'],
    () => client.get<ApiSuccess<StatsData>>(endpoints.stats.summary).then((r) => r.data),
    { staleTime: 60_000, enabled: isAdmin },
  );

  const cards = [
    {
      label: 'Total Users',
      value: isAdmin ? (data?.userCount ?? 0) : 0,
      description: isAdmin ? 'Registered accounts' : undefined,
      isLoading: isAdmin && isLoading,
    },
    {
      label: 'AI Runs',
      value: 0, // TODO: wire to AI workflow run count
    },
    {
      label: 'Files Uploaded',
      value: 0, // TODO: wire to Supabase Storage object count
    },
    {
      label: 'Active Today',
      value: 0, // TODO: wire to session/event log
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">
        Welcome back, {user?.user_metadata?.full_name ?? user?.email}
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {isAdmin && <RoleChart data={data} isLoading={isLoading} isError={isError} />}
    </div>
  );
};

export default DashboardPage;
