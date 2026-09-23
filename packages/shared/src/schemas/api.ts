import { z } from 'zod';

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), data: dataSchema });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
  fields: z.record(z.string()).optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion('success', [apiSuccessSchema(dataSchema), apiErrorSchema]);

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
