import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().url('LLM_BASE_URL must be a valid URL').optional(),
  LLM_MODEL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  MAINTENANCE_MODE: z.string().optional(),
  SENTRY_DSN: z.string().optional()
});

const raw = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  LLM_API_KEY: process.env.LLM_API_KEY || undefined,
  LLM_BASE_URL: process.env.LLM_BASE_URL || undefined,
  LLM_MODEL: process.env.LLM_MODEL || undefined,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE || undefined,
  SENTRY_DSN: process.env.SENTRY_DSN || undefined
};

const result = envSchema.safeParse(raw);

if (!result.success) {
  const missingOrInvalid = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  // Security invariant: never print env values, only key names and constraint errors
  const message = `Environment validation failed:\n${missingOrInvalid.map((k) => `  - ${k}`).join('\n')}`;
  throw new Error(message);
}

export const env = result.data;
