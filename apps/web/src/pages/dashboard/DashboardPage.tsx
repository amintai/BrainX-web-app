import { useAppSelector } from '../../store/hooks';
import { useFetchAPI } from '../../hooks/useFetchAPI';
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

  const { data, isLoading, hasError } = useFetchAPI<void, StatsData>({
    apiFunction: () =>
      client
        .get<ApiSuccess<StatsData>>(endpoints.stats.summary)
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: isAdmin,
    dependencyArray: [isAdmin],
  });

  const cards = [
    {
      label: 'Total Users',
      value: isAdmin ? (data?.userCount ?? 0) : 0,
      description: isAdmin ? 'Registered accounts' : undefined,
      isLoading: isAdmin && isLoading,
    },
    {
      label: 'AI Runs',
      value: 0,
    },
    {
      label: 'Files Uploaded',
      value: 0,
    },
    {
      label: 'Active Today',
      value: 0,
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

      {isAdmin && <RoleChart data={data} isLoading={isLoading} isError={hasError} />}
    </div>
  );
};

export default DashboardPage;
