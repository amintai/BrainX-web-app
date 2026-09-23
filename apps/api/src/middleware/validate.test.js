import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validate } from './validate.js';
import { paginationQuerySchema } from '../validators/common.validators.js';
import { errorHandler } from './errorHandler.js';

function buildApp() {
  const app = express();
  app.get('/items', validate({ query: paginationQuerySchema }), (req, res) => {
    res.json({ success: true, data: req.validated.query });
  });
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('returns 400 VALIDATION_ERROR for an invalid query string', async () => {
    const app = buildApp();
    const res = await request(app).get('/items').query({ page: 'not-a-number-like-this' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: expect.any(String) },
    });
  });

  it('populates req.validated.query for a valid query string', async () => {
    const app = buildApp();
    const res = await request(app).get('/items').query({ page: '2', limit: '10' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ page: 2, limit: 10 });
  });
});
