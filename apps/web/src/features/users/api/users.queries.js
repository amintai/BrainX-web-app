import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchUsers } from './users.api.js';

export const userKeys = {
  all: ['users'],
  list: (params) => [...userKeys.all, 'list', params],
};

/** Server-shaped query contract (ADR-6): params in the key, no client-side full-list derivation. */
export function useUsers(params) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}
