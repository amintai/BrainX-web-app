import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('GET /api/v1/users/me', () => {
  beforeEach(() => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with profile when authenticated', async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    } as never);

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(mockUser.email);
  });
});
