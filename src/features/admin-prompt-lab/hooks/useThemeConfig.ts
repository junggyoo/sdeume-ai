'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { ThemeConfig } from '../types';
import type { ThemeSlug } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

interface UseThemeConfigReturn {
  themes: ThemeConfig[];
  selectedTheme: ThemeConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchThemes: () => Promise<void>;
  selectTheme: (slug: ThemeSlug) => void;
}

// =============================================================================
// Hook
// =============================================================================

export const useThemeConfig = (): UseThemeConfigReturn => {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid fetchThemes changing when selectedTheme changes
  const selectedThemeRef = useRef(selectedTheme);
  selectedThemeRef.current = selectedTheme;

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/prompt-test/themes', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error?.message || 'Failed to fetch themes');
        return;
      }

      const themeList = data.data as ThemeConfig[];
      setThemes(themeList);

      // Select first theme by default (use ref to avoid stale closure)
      if (themeList.length > 0 && !selectedThemeRef.current) {
        setSelectedTheme(themeList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectTheme = useCallback((slug: ThemeSlug) => {
    const theme = themes.find(t => t.slug === slug);
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [themes]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchThemes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    themes,
    selectedTheme,
    isLoading,
    error,
    fetchThemes,
    selectTheme,
  };
};
