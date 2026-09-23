import { useAuth } from '../features/auth/useAuth.js';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto mt-24 max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Welcome{user?.email ? `, ${user.email}` : ''}</h1>
      <p className="mt-2 text-gray-600">BrainX boilerplate is running.</p>
    </div>
  );
}
