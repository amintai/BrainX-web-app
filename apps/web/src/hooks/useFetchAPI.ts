import { useEffect, useState } from 'react';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { showToastSuccess, showToastError } from '../utils/common';

/**
 * Generic client-side data hook, built around a raw axios response
 * contract (`(params) => Promise<AxiosResponse<T>>`) rather than an
 * application-level success/error wrapper.
 *
 * It does not call the API itself on mount — it fires only when
 * `apiCallCondition` is truthy, and re-fires whenever `dependencyArray`
 * changes. This lets the same hook serve both:
 *  - on-demand mutations: a feature hook holds a `payload` in state and
 *    passes `Boolean(payload)` as `apiCallCondition` / `[payload]` as
 *    `dependencyArray` — calling `setPayload(...)` is what triggers the call.
 *  - fetch-on-param-change reads: pass `true` (or a derived condition) and
 *    the params that should trigger a refetch as `dependencyArray`.
 */
interface UseFetchApiOptions<TParams, TData> {
  apiFunction: (params: TParams) => Promise<AxiosResponse<TData>>;
  apiCallCondition?: boolean | number | string;
  apiParams?: TParams;
  dependencyArray?: unknown[];
  defaultResponseValue?: TData;
  showSuccessMessage?: boolean;
  hideErrorMessage?: boolean;
  successMessage?: string;
  errorMessage?: string;
  successCb?: (data: TData) => void;
  failureCb?: (error: unknown) => void;
}

function responseMessage(data: unknown): string | undefined {
  return data && typeof data === 'object' && 'message' in data
    ? (data as { message?: string }).message
    : undefined;
}

export function useFetchAPI<TParams = void, TData = void>({
  apiFunction,
  apiCallCondition = false,
  apiParams,
  dependencyArray = [],
  defaultResponseValue,
  showSuccessMessage = false,
  hideErrorMessage = false,
  successMessage,
  errorMessage,
  successCb,
  failureCb,
}: UseFetchApiOptions<TParams, TData>) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [isLoading, setLoading] = useState(false);
  const [hasError, setError] = useState(false);

  useEffect(() => {
    if (!apiCallCondition) return;

    let isCurrent = true;
    setLoading(true);

    apiFunction(apiParams as TParams)
      .then((response) => {
        if (!isCurrent) return;
        setLoading(false);

        if (response && response.status) {
          setData(response.data);
          setError(false);
          successCb?.(response.data);
          if (showSuccessMessage) {
            showToastSuccess(successMessage ?? responseMessage(response.data) ?? 'Success');
          }
        } else {
          // Defensive branch: axios rejects on any non-2xx status by
          // default, so this only fires for a custom `validateStatus`
          // override that resolves instead of throwing.
          setError(true);
          setData(defaultResponseValue);
          failureCb?.(defaultResponseValue);
          if (!hideErrorMessage) {
            showToastError(
              errorMessage ?? responseMessage(response?.data) ?? 'Something went wrong',
            );
          }
        }
      })
      .catch((error: unknown) => {
        // A rejected promise — axios rejects on any non-2xx response, a
        // network failure, or an uncaught error in the api function.
        if (!isCurrent) return;
        setLoading(false);
        setError(true);
        failureCb?.(error);

        // The app already redirects to /login on 401 (see client.ts's
        // response interceptor) — no need to also toast about it.
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return;
        }

        if (!hideErrorMessage) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? error.response?.data?.error)
            : error instanceof Error
              ? error.message
              : undefined;
          showToastError(errorMessage ?? message ?? 'Something went wrong');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, dependencyArray);

  return { data, isLoading, hasError };
}
