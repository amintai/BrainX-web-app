import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const result = envSchema.safeParse(import.meta.env);
if (!result.success) {
  const missing = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].join(', ');
  throw new Error(`Invalid or missing frontend environment variables: ${missing}`);
}

export const env = Object.freeze(result.data);
