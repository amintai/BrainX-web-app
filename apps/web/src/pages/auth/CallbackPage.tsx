import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ROUTES } from '../../routes/routePaths';
import { showToastError } from '../../utils/common';

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        showToastError('Authentication failed. Please try again.');
        navigate(ROUTES.login);
      } else if (session) {
        navigate(ROUTES.dashboard);
      } else {
        navigate(ROUTES.login);
      }
    });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Completing sign-in…
    </div>
  );
};

export default CallbackPage;
