import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequireAuth } from '../src/middleware/requireAuth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

function buildApp(authService) {
  const app = express();
  app.get('/protected', createRequireAuth(authService), (req, res) => {
    res.json({ success: true, data: { user: req.user } });
  });
  app.use(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('sets req.user and calls next() for a valid bearer token', async () => {
    const fakeAuthService = {
      verifyAccessToken: vi
        .fn()
        .mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'authenticated' }),
    };
    const app = buildApp(fakeAuthService);
    const res = await request(app).get('/protected').set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({ id: 'u1', email: 'a@b.com', role: 'authenticated' });
    expect(fakeAuthService.verifyAccessToken).toHaveBeenCalledWith('good-token');
  });

  it('returns 401 UNAUTHORIZED with no Authorization header, never invoking the real client', async () => {
    const fakeAuthService = { verifyAccessToken: vi.fn() };
    const app = buildApp(fakeAuthService);
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'UNAUTHORIZED', message: expect.any(String) },
    });
    expect(fakeAuthService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('returns 401 UNAUTHORIZED when the injected authService rejects an invalid token', async () => {
    const fakeAuthService = {
      verifyAccessToken: vi.fn().mockRejectedValue(new Error('invalid token')),
    };
    const app = buildApp(fakeAuthService);
    const res = await request(app).get('/protected').set('Authorization', 'Bearer bad-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
