import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  respond,
  type HandlerResult,
} from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import type { Theme, ThemeRow } from '@/features/theme/types';
import { mapThemeRowToTheme } from '@/features/theme/types';

// =============================================================================
// Error Codes
// =============================================================================

type ThemeServiceError = 'THEME_NOT_FOUND' | 'THEME_FETCH_ERROR' | 'UNAUTHORIZED';

// =============================================================================
// Service Functions
// =============================================================================

const getThemes = async (
  supabase: SupabaseClient
): Promise<HandlerResult<Theme[], ThemeServiceError>> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    return failure(500, 'THEME_FETCH_ERROR', error.message);
  }

  const themes = (data as ThemeRow[]).map(mapThemeRowToTheme);
  return success(themes);
};

const getThemeBySlug = async (
  supabase: SupabaseClient,
  slug: string
): Promise<HandlerResult<Theme, ThemeServiceError>> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, 'THEME_NOT_FOUND', 'Theme not found');
    }
    console.error('Error fetching theme:', error);
    return failure(500, 'THEME_FETCH_ERROR', error.message);
  }

  return success(mapThemeRowToTheme(data as ThemeRow));
};

// =============================================================================
// Chainable Routes (for Hono RPC type inference)
// =============================================================================

export const themeRoutes = new Hono<AppEnv>()
  // GET / - 테마 목록 조회
  .get('/', async (c) => {
    const supabase = getSupabase(c);
    const result = await getThemes(supabase);
    return respond(c, result);
  })
  // GET /:slug - 테마 상세 조회
  .get('/:slug', async (c) => {
    const supabase = getSupabase(c);
    const slug = c.req.param('slug');
    const result = await getThemeBySlug(supabase, slug);
    return respond(c, result);
  });

// =============================================================================
// Legacy Registration (for backward compatibility)
// =============================================================================

export const registerThemeRoutes = (app: Hono<AppEnv>) => {
  app.route('/themes', themeRoutes);
};
