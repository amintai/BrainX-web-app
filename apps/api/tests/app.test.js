import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const testConfig = {
  nodeEnv: 'test',
  port: 0,
  logLevel: 'silent',
  corsOrigin: ['http://localhost:5173'],
  trustProxy: false,
  rateLimit: { windowMs: 900000, max: 100 },
  supabase: { url: 'http://127.0.0.1:54321', serviceRoleKey: 'test-key' },
  ai: {},
};

const fakeAuthService = {
  async verifyAccessToken() {
    throw new Error('not used in this suite');
  },
};

function buildApp(overrides = {}) {
  return createApp({ config: testConfig, authService: fakeAuthService, ...overrides });
}

describe('createApp — cross-cutting middleware', () => {
  it('applies the configured trust proxy setting', () => {
    const app = buildApp({ config: { ...testConfig, trustProxy: true } });
    expect(app.get('trust proxy')).toBe(true);
  });

  it('defaults trust proxy to the configured false value', () => {
    const app = buildApp();
    expect(app.get('trust proxy')).toBe(false);
  });

  it('includes Helmet security headers', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('reflects the configured CORS origin', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('returns the success envelope for a valid route', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ status: 'ok' });
  });

  it('returns 404 NOT_FOUND for an unmatched path without the /api/v1 prefix', async () => {
    const app = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    });
  });

  it('returns 404 NOT_FOUND for an unmatched path with the /api/v1 prefix', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 413 PAYLOAD_TOO_LARGE for a body over 1MB', async () => {
    const app = buildApp();
    const bigPayload = { data: 'x'.repeat(1024 * 1024 + 100) };
    const res = await request(app).post('/api/v1/health').send(bigPayload);
    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: expect.any(String) },
    });
  });

  it('returns 400 INVALID_JSON for a malformed JSON body', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{ this is not json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'INVALID_JSON', message: expect.any(String) },
    });
  });

  it('returns 429 RATE_LIMITED after exceeding the configured max requests', async () => {
    const app = buildApp({ rateLimit: { windowMs: 900000, max: 3 } });
    for (let i = 0; i < 3; i += 1) {
      const ok = await request(app).get('/api/v1/health');
      expect(ok.status).toBe(200);
    }
    const limited = await request(app).get('/api/v1/health');
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: { code: 'RATE_LIMITED', message: expect.any(String) },
    });
  });
});
