import { QueryClient } from '@tanstack/react-query';

export function shouldRetry(failureCount, error) {
  const status = error?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 3;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
  },
});
