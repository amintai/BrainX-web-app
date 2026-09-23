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

describe('DELETE /api/v1/users/me', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 204 and deletes the account when authenticated', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValueOnce({
      data: { user: {} as never },
      error: null,
    });

    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(204);
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith(mockUser.id);
  });

  it('returns 500 when Supabase delete fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValueOnce({
      data: { user: {} as never },
      error: new Error('Delete failed') as never,
    });

    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DELETE_FAILED');
  });
});
