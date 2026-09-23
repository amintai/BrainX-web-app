import { Router } from 'express';
import { getMeController } from '../controllers/me.controller.js';
import { requireAuth as defaultRequireAuth } from '../middleware/requireAuth.js';

export function createMeRouter(requireAuth = defaultRequireAuth) {
  const router = Router();
  router.get('/me', requireAuth, getMeController);
  return router;
}
