import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { AppError } from '../src/utils/AppError.js';

function buildApp(handler) {
  const app = express();
  app.get('/boom', handler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps AppError to its status/code with no stack in the body', async () => {
    const app = buildApp((req, res, next) => next(new AppError(404, 'NOT_FOUND', 'nope')));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: 'nope' } });
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('maps a ZodError to 400 VALIDATION_ERROR', async () => {
    const schema = z.object({ name: z.string() });
    const app = buildApp((req, res, next) => {
      try {
        schema.parse({});
      } catch (err) {
        next(err);
      }
    });
    const res = await request(app).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps an unhandled generic Error to a 500 envelope with a generic message, not err.message', async () => {
    const app = buildApp(() => {
      throw new Error('leaky internal detail: db password is hunter2');
    });
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).not.toContain('hunter2');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });
});
