import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../validators/validate';
import { updateProfileSchema, updateRoleSchema } from '../validators/users.schema';
import { paginationSchema } from '../validators/pagination.schema';
import * as UsersController from '../controllers/users.controller';
import * as OnboardingController from '../controllers/onboarding.controller';
import * as AvatarController from '../controllers/avatar.controller';
import { avatarUploadMiddleware } from '../middleware/avatarUpload.middleware';
import { ROLE_ADMIN } from '@brainx/shared';

const router = Router();

router.use(authenticate);

router.get('/me', UsersController.getMe);
router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);
router.patch('/me/onboarding/complete', OnboardingController.completeOnboarding);
router.post('/me/avatar', avatarUploadMiddleware, AvatarController.uploadAvatar);

// Admin only
router.get(
  '/',
  authorize([ROLE_ADMIN]),
  validate(paginationSchema, 'query'),
  UsersController.listUsers,
);
router.get('/:id', authorize([ROLE_ADMIN]), UsersController.getUserById);
router.patch(
  '/:id/role',
  authorize([ROLE_ADMIN]),
  validate(updateRoleSchema),
  UsersController.updateUserRole,
);

export default router;
