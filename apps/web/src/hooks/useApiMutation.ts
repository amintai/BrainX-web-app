import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import type { ApiSuccess } from '@brainx/shared';
import { showToastSuccess, showToastError } from '../utils/common';

type MutationFn<T, V> = (variables: V) => Promise<ApiSuccess<T>>;

interface UseApiMutationOptions<T, V> extends Omit<UseMutationOptions<T, Error, V>, 'mutationFn'> {
  successMessage?: string;
  errorMessage?: string;
}

export const useApiMutation = <T, V = void>(
  mutationFn: MutationFn<T, V>,
  { successMessage, errorMessage, onSuccess, onError, ...options }: UseApiMutationOptions<T, V> = {},
) =>
  useMutation<T, Error, V>({
    mutationFn: async (variables) => {
      const res = await mutationFn(variables);
      return res.data;
    },
    onSuccess: (data, vars, ctx) => {
      if (successMessage) showToastSuccess(successMessage);
      onSuccess?.(data, vars, ctx);
    },
    onError: (err, vars, ctx) => {
      showToastError(errorMessage ?? err.message ?? 'Something went wrong');
      onError?.(err, vars, ctx);
    },
    ...options,
  });
