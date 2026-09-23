import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { ROLE_ADMIN } from '@brainx/shared';
import * as StatsController from '../controllers/stats.controller';

const router = Router();
router.use(authenticate);
router.get('/', authorize([ROLE_ADMIN]), StatsController.getStats);

export default router;
