'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  AdminPromptTest,
  PromptTestHistoryQuery,
  PromptTestHistoryResponse,
  PromptTestUpdateRequest,
  QualityIssueId,
} from '../types';
import type { ThemeSlug } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

interface UseTestHistoryParams {
  initialQuery?: PromptTestHistoryQuery;
  autoFetch?: boolean;
}

interface UseTestHistoryReturn {
  tests: AdminPromptTest[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  query: PromptTestHistoryQuery;
  setQuery: (query: Partial<PromptTestHistoryQuery>) => void;
  fetchHistory: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateTest: (testId: string, updates: PromptTestUpdateRequest) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  getTestById: (testId: string) => Promise<AdminPromptTest | null>;
}

// =============================================================================
// Hook
// =============================================================================

export const useTestHistory = ({
  initialQuery = { limit: 20, offset: 0 },
  autoFetch = true,
}: UseTestHistoryParams = {}): UseTestHistoryReturn => {
  const [tests, setTests] = useState<AdminPromptTest[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQueryState] = useState<PromptTestHistoryQuery>(initialQuery);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.themeSlug) params.set('themeSlug', query.themeSlug);
      if (query.qualityIssue) params.set('qualityIssue', query.qualityIssue);
      if (query.isFavorite !== undefined) params.set('isFavorite', String(query.isFavorite));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.offset) params.set('offset', String(query.offset));

      const response = await fetch(`/api/admin/prompt-test/history?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error?.message || 'Failed to fetch history');
        return;
      }

      const historyResponse = data.data as PromptTestHistoryResponse;

      if (query.offset === 0) {
        setTests(historyResponse.tests);
      } else {
        setTests(prev => [...prev, ...historyResponse.tests]);
      }
      setTotal(historyResponse.total);
      setHasMore(historyResponse.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const setQuery = useCallback((newQuery: Partial<PromptTestHistoryQuery>) => {
    setQueryState(prev => ({
      ...prev,
      ...newQuery,
      offset: newQuery.themeSlug !== undefined ||
              newQuery.qualityIssue !== undefined ||
              newQuery.isFavorite !== undefined
        ? 0
        : newQuery.offset ?? prev.offset,
    }));
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setQueryState(prev => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? 20),
    }));
  }, [hasMore, isLoading]);

  const updateTest = useCallback(async (testId: string, updates: PromptTestUpdateRequest) => {
    try {
      const response = await fetch(`/api/admin/prompt-test/history/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to update test');
      }

      // Update local state
      setTests(prev =>
        prev.map(test =>
          test.id === testId ? { ...test, ...data.data } : test
        )
      );
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteTest = useCallback(async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/prompt-test/history/${testId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to delete test');
      }

      // Remove from local state
      setTests(prev => prev.filter(test => test.id !== testId));
      setTotal(prev => prev - 1);
    } catch (err) {
      throw err;
    }
  }, []);

  const getTestById = useCallback(async (testId: string): Promise<AdminPromptTest | null> => {
    try {
      const response = await fetch(`/api/admin/prompt-test/history/${testId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.ok) {
        return null;
      }

      return data.data as AdminPromptTest;
    } catch {
      return null;
    }
  }, []);

  // Auto-fetch on mount and query changes
  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  return {
    tests,
    total,
    hasMore,
    isLoading,
    error,
    query,
    setQuery,
    fetchHistory,
    loadMore,
    updateTest,
    deleteTest,
    getTestById,
  };
};
