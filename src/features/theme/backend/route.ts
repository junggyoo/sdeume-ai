import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { getThemes, getThemeBySlug } from './service';

export function registerThemeRoutes(app: Hono<AppEnv>) {
  // GET /themes - 테마 목록 조회
  app.get('/themes', async (c) => {
    const supabase = getSupabase(c);
    const result = await getThemes(supabase);
    return respond(c, result);
  });

  // GET /themes/:slug - 테마 상세 조회
  app.get('/themes/:slug', async (c) => {
    const supabase = getSupabase(c);
    const slug = c.req.param('slug');
    const result = await getThemeBySlug(supabase, slug);
    return respond(c, result);
  });

  return app;
}
