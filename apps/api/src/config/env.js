import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Root of the monorepo (apps/api/src/config -> apps/api/src -> apps/api -> apps -> root)
const rootDir = path.resolve(import.meta.dirname, '../../../..');

// Precedence: real process.env > .env.local > .env
// dotenv.config() never overwrites a key already present in process.env, so loading
// .env.local first and .env second yields exactly that precedence.
dotenv.config({ path: path.join(rootDir, '.env.local'), quiet: true });
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(['anthropic', 'openai']).optional(),
  AI_MODEL: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
});

/**
 * Parses and freezes the application configuration from a raw environment source.
 * Exported (in addition to the default `config` singleton) so tests can build a
 * config object from an arbitrary env object without relying on module caching.
 */
export function loadConfig(source = process.env) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const missing = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].join(
      ', ',
    );
    throw new Error(`Invalid or missing environment variables: ${missing}`);
  }

  const env = result.data;

  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    corsOrigin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    trustProxy: env.TRUST_PROXY,
    rateLimit: Object.freeze({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
    }),
    supabase: Object.freeze({
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    }),
    ai: Object.freeze({
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      apiKey: env.AI_API_KEY,
    }),
  });
}

export const config = loadConfig();
