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

const mockAdminUser = {
  ...mockUser,
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@brainx.io',
  app_metadata: { role: 'admin' },
};

const mockProfiles = [
  { role: 'admin' },
  { role: 'admin' },
  { role: 'manager' },
  { role: 'member' },
  { role: 'member' },
  { role: 'member' },
];

describe('GET /api/v1/stats', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/v1/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when authenticated as non-admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 with role counts when admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    } as never);

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      userCount: 6,
      adminCount: 2,
      managerCount: 1,
      memberCount: 3,
    });
  });

  it('returns 500 when Supabase query fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') }),
    } as never);

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FETCH_FAILED');
  });
});
