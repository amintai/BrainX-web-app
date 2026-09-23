import { z } from 'zod';

export const kpisSchema = z.object({
  activeUsers: z.object({ value: z.number().int(), changePct: z.number() }),
  licenses: z.object({ allocated: z.number().int(), total: z.number().int().positive() }),
  systemHealth: z.object({
    uptimePct: z.number(),
    incidents: z.number().int(),
    status: z.literal('nominal'),
  }),
  pendingAccess: z.object({ count: z.number().int() }),
});

const activityTargetSchema = z
  .object({
    label: z.string(),
    format: z.enum(['code', 'emphasis']),
  })
  .nullable();

const activityEntrySchema = z.object({
  id: z.string(),
  actor: z.object({
    name: z.string(),
    kind: z.enum(['user', 'system']),
    avatarUrl: z.string().nullable(),
  }),
  summary: z.string(),
  target: activityTargetSchema,
  occurredAt: z.string(),
  category: z.enum(['secops', 'access-control', 'automation', 'governance']),
  type: z.enum(['token-created', 'access-approved', 'key-rotation', 'role-schema-changed']),
});

export const activityListSchema = z.array(activityEntrySchema);

export const roleBreakdownSchema = z.object({
  roles: z.array(
    z.object({
      key: z.enum(['admins', 'editors', 'viewers']),
      label: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const onboardingChecklistSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    completed: z.boolean(),
    actionLabel: z.string(),
  }),
);
