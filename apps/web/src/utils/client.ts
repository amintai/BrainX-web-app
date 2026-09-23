import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import { getBaseURL, showToastError } from './common';

const client = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase JWT to every outbound request
client.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// On 401, attempt one token refresh then retry; on failure, sign out
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const {
        data: { session },
      } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${session.access_token}`,
        };
        return client.request(original);
      }
      await supabase.auth.signOut();
    }

    // Global handler: show toast for 5xx errors so callers don't need to
    if (error.response?.status >= 500) {
      showToastError('A server error occurred. Please try again.');
    }

    return Promise.reject(error);
  },
);

export const get = <T = unknown>(url: string, params?: object): Promise<T> =>
  client.get<T>(url, { params }).then((r) => r.data);

export const post = <T = unknown>(url: string, body?: unknown): Promise<T> =>
  client.post<T>(url, body).then((r) => r.data);

export const put = <T = unknown>(url: string, body?: unknown): Promise<T> =>
  client.put<T>(url, body).then((r) => r.data);

export const patch = <T = unknown>(url: string, body?: unknown): Promise<T> =>
  client.patch<T>(url, body).then((r) => r.data);

export const del = <T = unknown>(url: string, params?: object): Promise<T> =>
  client.delete<T>(url, { params }).then((r) => r.data);

export default client;
