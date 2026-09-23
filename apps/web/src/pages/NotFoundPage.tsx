import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routePaths';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <button
        onClick={() => navigate(ROUTES.dashboard)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default NotFoundPage;
