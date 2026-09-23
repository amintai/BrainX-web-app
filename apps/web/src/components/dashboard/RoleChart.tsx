import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsData {
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

interface RoleChartProps {
  data: StatsData | undefined;
  isLoading: boolean;
  isError: boolean;
}

const RoleChart = ({ data, isLoading, isError }: RoleChartProps) => {
  if (isError) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Users by Role</p>
        <p className="mt-4 text-sm text-gray-400">Could not load chart data</p>
      </div>
    );
  }

  const chartData = [
    { role: 'Member', count: data?.memberCount ?? 0 },
    { role: 'Manager', count: data?.managerCount ?? 0 },
    { role: 'Admin', count: data?.adminCount ?? 0 },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-medium text-gray-500">Users by Role</p>
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-md bg-gray-200" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="role" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RoleChart;
