import axios from 'axios';
import { supabase } from './supabase.js';
import { env } from './env.js';

/**
 * Thrown by the request interceptor when there is no session, or it is
 * expired, before any network call is made (FR-011: blocked at the client).
 */
export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required — no active session.') {
    super(message);
    this.name = 'AuthRequiredError';
    // Semantically a 401 — lets shared retry logic (e.g. queryClient's
    // shouldRetry) recognise this as a non-retryable 4xx without special-casing.
    this.status = 401;
  }
}

/** Normalised error shape surfaced to callers for non-auth-gated failures. */
export class ApiError extends Error {
  constructor({ status, code, message }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isSessionExpired(session) {
  if (!session) return true;
  if (!session.expires_at) return false;
  return session.expires_at * 1000 <= Date.now();
}

export const apiClient = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
});

// Auth-required-by-default: every request is gated unless the caller opts
// out with { skipAuth: true } (used for public endpoints like /health).
apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth) {
    return config;
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (isSessionExpired(session)) {
    throw new AuthRequiredError();
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

// Unwraps { success, data } for TanStack Query and normalises errors.
apiClient.interceptors.response.use(
  (response) => response.data?.data,
  async (error) => {
    if (error instanceof AuthRequiredError) {
      throw error;
    }

    const status = error.response?.status;
    const serverError = error.response?.data?.error;

    if (status === 401) {
      await supabase.auth.signOut();
    }

    throw new ApiError({
      status,
      code: serverError?.code ?? 'UNKNOWN_ERROR',
      message: serverError?.message ?? error.message ?? 'Request failed.',
    });
  },
);

export default apiClient;
