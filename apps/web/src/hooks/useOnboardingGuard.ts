import { useNavigate } from 'react-router-dom';
import { useFetchAPI } from './useFetchAPI';
import client from '../utils/client';
import { endpoints } from '../utils/endpoints';
import { ROUTES } from '../routes/routePaths';
import type { ApiSuccess } from '@brainx/shared';

interface ProfileMe {
  onboarding_completed_at: string | null;
}

export const useOnboardingGuard = () => {
  const navigate = useNavigate();

  useFetchAPI<void, ProfileMe>({
    apiFunction: () =>
      client
        .get<ApiSuccess<ProfileMe>>(endpoints.auth.me)
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: true,
    dependencyArray: [],
    hideErrorMessage: true,
    successCb: (data) => {
      if (data?.onboarding_completed_at == null) {
        navigate(ROUTES.onboarding, { replace: true });
      }
    },
  });
};
