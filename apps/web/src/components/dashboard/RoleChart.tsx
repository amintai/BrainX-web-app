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
        <div className="flex h-[220px] items-end gap-6 px-2">
          {[55, 35, 75].map((heightPct, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full animate-pulse rounded-t-sm bg-gray-200"
                style={{ height: `${heightPct}%` }}
              />
              <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
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
