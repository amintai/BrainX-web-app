import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import type { ApiSuccess } from '@brainx/shared';

type QueryFn<T> = () => Promise<ApiSuccess<T>>;

export const useApiQuery = <T>(
  key: QueryKey,
  fetchFn: QueryFn<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<T, Error>({
    queryKey: key,
    queryFn: async () => {
      const res = await fetchFn();
      return res.data;
    },
    ...options,
  });
