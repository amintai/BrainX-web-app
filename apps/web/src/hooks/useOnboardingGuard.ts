import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiQuery } from './useApiQuery';
import client from '../utils/client';
import { endpoints } from '../utils/endpoints';
import { ROUTES } from '../routes/routePaths';
import type { ApiSuccess } from '@brainx/shared';

interface ProfileMe {
  onboarding_completed_at: string | null;
}

export const useOnboardingGuard = () => {
  const navigate = useNavigate();

  const { data, isSuccess } = useApiQuery<ProfileMe>(
    ['profile', 'me'],
    () => client.get<ApiSuccess<ProfileMe>>(endpoints.auth.me).then((r) => r.data),
    { staleTime: 30_000 },
  );

  useEffect(() => {
    if (isSuccess && data?.onboarding_completed_at == null) {
      navigate(ROUTES.onboarding, { replace: true });
    }
  }, [isSuccess, data, navigate]);
};
