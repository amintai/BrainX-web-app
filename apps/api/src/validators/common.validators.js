import { z } from 'zod';

// Reusable example schema — a pattern reference for future validators, not
// wired to any live route in the scaffold.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
