import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../validators/validate';
import { updateProfileSchema } from '../validators/users.schema';
import { paginationSchema } from '../validators/pagination.schema';
import * as UsersController from '../controllers/users.controller';
import { ROLE_ADMIN } from '@brainx/shared';

const router = Router();

router.use(authenticate);

router.get('/me', UsersController.getMe);
router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);

// Admin only
router.get('/', authorize([ROLE_ADMIN]), validate(paginationSchema, 'query'), UsersController.listUsers);

export default router;
