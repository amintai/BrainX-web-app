import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { supabase } from './supabase.js';
import { apiClient, AuthRequiredError, ApiError } from './apiClient.js';

describe('apiClient — auth-required-by-default gating (FR-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with AuthRequiredError and never invokes the adapter when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    const adapterSpy = vi.fn();
    apiClient.defaults.adapter = adapterSpy;

    await expect(apiClient.get('/me')).rejects.toBeInstanceOf(AuthRequiredError);
    expect(adapterSpy).not.toHaveBeenCalled();
  });

  it('sets status 401 on AuthRequiredError so shared retry logic fails fast', () => {
    expect(new AuthRequiredError().status).toBe(401);
  });

  it('attaches Authorization: Bearer <token> for a valid, unexpired session', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: { access_token: 'tok123', expires_at: Math.floor(Date.now() / 1000) + 3600 },
      },
    });

    let capturedConfig;
    apiClient.defaults.adapter = vi.fn(async (config) => {
      capturedConfig = config;
      return {
        data: { success: true, data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });

    await apiClient.get('/me');
    expect(capturedConfig.headers.Authorization).toBe('Bearer tok123');
  });

  it('signs out locally exactly once on a server 401 and normalises the error', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: { access_token: 'tok123', expires_at: Math.floor(Date.now() / 1000) + 3600 },
      },
    });
    apiClient.defaults.adapter = vi.fn(async () => {
      const error = new Error('Unauthorized');
      error.response = {
        status: 401,
        data: { success: false, error: { code: 'UNAUTHORIZED', message: 'nope' } },
      };
      throw error;
    });

    await expect(apiClient.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
