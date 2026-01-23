import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Upload, BucketSummary } from '../types';

interface ApiResponse {
  ok: boolean;
  data?: Upload[];
  error?: { message: string };
}

const emptyBucketSummary: BucketSummary = {
  bucketA: 0,
  bucketB: 0,
  bucketC: 0,
  bucketD: 0,
  total: 0,
  usableCount: 0,
};

const calculateBucketSummary = (uploads: Upload[]): BucketSummary => {
  const summary = uploads.reduce(
    (acc, upload) => {
      acc.total += 1;
      switch (upload.bucketType) {
        case 'A':
          acc.bucketA += 1;
          acc.usableCount += 1;
          break;
        case 'B':
          acc.bucketB += 1;
          acc.usableCount += 1;
          break;
        case 'C':
          acc.bucketC += 1;
          acc.usableCount += 1;
          break;
        case 'D':
          acc.bucketD += 1;
          break;
        // null bucketType counts toward total but not usable
      }
      return acc;
    },
    { ...emptyBucketSummary }
  );

  return summary;
};

/**
 * Hook to fetch existing uploads for a project.
 * Used in Edit Mode when user navigates back from Step2 to Step1.
 */
export function useProjectUploads(projectId: string) {
  const query = useQuery({
    queryKey: ['uploads', 'project', projectId],
    queryFn: async (): Promise<Upload[]> => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session');
      }

      const response = await fetch(`/api/upload/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Failed to fetch uploads');
      }

      return data.data || [];
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter uploads by role
  const groomUploads = useMemo(
    () => (query.data ?? []).filter((u) => u.role === 'groom'),
    [query.data]
  );

  const brideUploads = useMemo(
    () => (query.data ?? []).filter((u) => u.role === 'bride'),
    [query.data]
  );

  // Calculate bucket summaries
  const groomBucketSummary = useMemo(
    () => calculateBucketSummary(groomUploads),
    [groomUploads]
  );

  const brideBucketSummary = useMemo(
    () => calculateBucketSummary(brideUploads),
    [brideUploads]
  );

  return {
    uploads: query.data ?? [],
    groomUploads,
    brideUploads,
    groomCount: groomUploads.length,
    brideCount: brideUploads.length,
    groomBucketSummary,
    brideBucketSummary,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
