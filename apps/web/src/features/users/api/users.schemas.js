import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['administrator', 'manager', 'member', 'guest']),
  status: z.enum(['active', 'pending', 'inactive']),
  avatarUrl: z.string().nullable(),
});

export const userListResponseSchema = z.object({
  items: z.array(userSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
