import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { supabaseAdmin } from '../integrations/supabase';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@brainx.io',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockProfile = {
  id: mockUser.id,
  email: mockUser.email,
  full_name: 'Test User',
  avatar_url: null,
  role: 'member',
  onboarding_completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PATCH /api/v1/users/me/onboarding/complete', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding/complete');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with updated profile when authenticated', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    } as never);

    const res = await request(app)
      .patch('/api/v1/users/me/onboarding/complete')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.onboarding_completed_at).toBeTruthy();
  });

  it('returns 500 when Supabase update fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    } as never);

    const res = await request(app)
      .patch('/api/v1/users/me/onboarding/complete')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UPDATE_FAILED');
  });
});
