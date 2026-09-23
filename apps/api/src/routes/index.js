import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { createMeRouter } from './me.routes.js';

export function createV1Router({ requireAuth } = {}) {
  const router = Router();
  router.use(healthRouter);
  router.use(createMeRouter(requireAuth));
  return router;
}
