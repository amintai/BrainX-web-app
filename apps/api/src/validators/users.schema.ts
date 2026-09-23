import { updateProfileSchema } from '@brainx/shared';
import { z } from 'zod';

export { updateProfileSchema };

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'member']),
});
