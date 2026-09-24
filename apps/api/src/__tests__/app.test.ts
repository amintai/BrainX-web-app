import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('BrainX API', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('Unknown route returns 404 with error envelope', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST body over 1 MB returns 413', async () => {
    const bigPayload = { data: 'x'.repeat(1024 * 1024 + 1) };
    const res = await request(app).post('/api/v1/ping').send(bigPayload);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('Malformed JSON returns 400 with error envelope', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('Disallowed CORS origin returns 403, not 500', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
