import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // Support both new (PUBLISHABLE_KEY) and legacy (ANON_KEY) naming
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Fallback to legacy ANON_KEY if PUBLISHABLE_KEY is not set
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

if (!_clientEnv.success) {
  console.error('환경 변수 검증 실패:', _clientEnv.error.flatten().fieldErrors);
  throw new Error('환경 변수를 확인하세요.');
}

export const env: ClientEnv = _clientEnv.data;
