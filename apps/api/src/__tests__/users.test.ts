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

const mockAdminUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@brainx.io',
  app_metadata: { role: 'admin' },
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

describe('GET /api/v1/users/:id', () => {
  const targetId = '00000000-0000-0000-0000-000000000099';

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get(`/api/v1/users/${targetId}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when authenticated as non-admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });

    const res = await request(app)
      .get(`/api/v1/users/${targetId}`)
      .set('Authorization', 'Bearer member-token');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with profile when authenticated as admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });

    const targetProfile = {
      id: targetId,
      email: 'other@brainx.io',
      full_name: 'Other User',
      avatar_url: null,
      role: 'member',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: targetProfile, error: null }),
    } as never);

    const res = await request(app)
      .get(`/api/v1/users/${targetId}`)
      .set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(targetId);
  });
});

describe('PATCH /api/v1/users/:id/role', () => {
  const targetId = '00000000-0000-0000-0000-000000000099';

  it('returns 401 when no token provided', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${targetId}/role`)
      .send({ role: 'manager' });
    expect(res.status).toBe(401);
  });

  it('returns 422 with invalid role value', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });

    const res = await request(app)
      .patch(`/api/v1/users/${targetId}/role`)
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'superuser' });
    expect(res.status).toBe(422);
  });

  it('returns 200 with updated profile when admin sends valid role', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });

    vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
      data: { user: {} as never },
      error: null,
    });

    const updatedProfile = {
      id: targetId,
      email: 'other@brainx.io',
      full_name: 'Other User',
      avatar_url: null,
      role: 'manager',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
    } as never);

    const res = await request(app)
      .patch(`/api/v1/users/${targetId}/role`)
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'manager' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('manager');
  });
});
