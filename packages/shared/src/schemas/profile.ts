import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
