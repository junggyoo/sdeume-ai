'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { Theme } from '../types';

interface ThemesResponse {
  ok: true;
  data: Theme[];
}

interface ThemeResponse {
  ok: true;
  data: Theme;
}

async function fetchThemes(): Promise<Theme[]> {
  const { data } = await apiClient.get<ThemesResponse>('/api/themes');
  if (!data.ok) {
    throw new Error('Failed to fetch themes');
  }
  return data.data;
}

async function fetchThemeBySlug(slug: string): Promise<Theme> {
  const { data } = await apiClient.get<ThemeResponse>(`/api/themes/${slug}`);
  if (!data.ok) {
    throw new Error('Failed to fetch theme');
  }
  return data.data;
}

export const themeKeys = {
  all: ['themes'] as const,
  detail: (slug: string) => ['themes', slug] as const,
};

export function useThemes() {
  return useQuery({
    queryKey: themeKeys.all,
    queryFn: fetchThemes,
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });
}

export function useTheme(slug: string) {
  return useQuery({
    queryKey: themeKeys.detail(slug),
    queryFn: () => fetchThemeBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });
}
