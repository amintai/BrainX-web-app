import { useAppSelector } from '../../store/hooks';

const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-500">Welcome, {user?.email}</p>
    </div>
  );
};

export default DashboardPage;
