import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

/**
 * Check if we're in build phase (not runtime)
 * During build, Next.js sets NODE_ENV to production but doesn't have runtime env vars
 */
const isBuildPhase = () => {
  // Check for Vercel build or Next.js build phase
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.VERCEL_ENV === undefined &&
    process.env.NODE_ENV === 'production' &&
    !process.env.SUPABASE_URL
  );
};

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // During build phase, return placeholder config
  if (isBuildPhase()) {
    return {
      supabase: {
        url: 'https://placeholder.supabase.co',
        serviceRoleKey: 'placeholder-key',
      },
    } satisfies AppConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
