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
  avatar_url:
    'https://example.supabase.co/storage/v1/object/public/avatars/00000000-0000-0000-0000-000000000001/avatar.jpg',
  role: 'member',
  onboarding_completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Tiny valid 1×1 JPEG (real JPEG magic bytes + minimal data)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
    'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oA' +
    'DAMBAAIRAxEAPwCwABmX/9k=',
  'base64',
);

describe('POST /api/v1/users/me/avatar', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when no file is attached', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILE');
  });

  it('returns 400 for non-image MIME type', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', Buffer.from('%PDF-1.4'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('returns 413 when file exceeds 2 MB', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    const bigBuffer = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('returns 200 with updated profile on valid upload', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    // Use mockReturnValue (not Once) so both storage.from() calls (upload + getPublicUrl) share the mock
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: mockProfile.avatar_url } }),
    } as never);
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    } as never);

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatar_url).toBe(mockProfile.avatar_url);
    // user_metadata must be updated so Redux auth state reflects the new avatar immediately
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({ user_metadata: { avatar_url: mockProfile.avatar_url } }),
    );
  });

  it('returns 500 when Supabase Storage upload fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.storage.from).mockReturnValueOnce({
      upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Storage error') }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('UPLOAD_FAILED');
  });
});
