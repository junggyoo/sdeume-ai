import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

/**
 * Server Component에서 사용하는 Supabase 클라이언트
 * 주의: Server Component에서는 쿠키 수정이 불가능하므로 setAll은 no-op
 * 세션 갱신은 middleware.ts에서 처리됨
 */
export const createSupabaseServerClient = async (): Promise<
  SupabaseClient<Database>
> => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server Component에서는 쿠키 수정 불가
          // 세션 갱신은 middleware.ts에서 처리됨
        },
      },
    }
  );
};
