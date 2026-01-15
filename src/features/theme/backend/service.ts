import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type { Theme, ThemeRow } from '../types';
import { mapThemeRowToTheme } from '../types';

export type ThemeServiceError =
  | 'THEME_NOT_FOUND'
  | 'THEME_FETCH_ERROR'
  | 'UNAUTHORIZED';

export async function getThemes(
  supabase: SupabaseClient
): Promise<HandlerResult<Theme[], ThemeServiceError>> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    return failure(500, 'THEME_FETCH_ERROR', error.message);
  }

  const themes = (data as ThemeRow[]).map(mapThemeRowToTheme);
  return success(themes);
}

export async function getThemeBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<HandlerResult<Theme, ThemeServiceError>> {
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
}
