'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useUploadStore } from '../store/upload-store';
import type { UploadRole, QueuedFile, Upload } from '../types';

interface UploadResult {
  ok: true;
  data: Upload;
}

interface UseUploadToStorageOptions {
  projectId: string;
  onUploadComplete?: (upload: Upload) => void;
  onError?: (error: Error) => void;
}

interface SyncOptions {
  projectIdOverride?: string;
}

interface UseUploadToStorageReturn {
  uploadImage: (item: QueuedFile) => Promise<Upload | null>;
  syncUploadsToServer: (role: UploadRole, options?: SyncOptions) => Promise<Upload[]>;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number;
}

const uploadSingleImage = async (
  projectId: string,
  item: QueuedFile
): Promise<Upload> => {
  // Get auth token
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', item.file);
  formData.append(
    'metadata',
    JSON.stringify({
      projectId,
      role: item.role,
      bucketType: item.analysis?.bucket || null,
      faceYaw: item.analysis?.yawAngle || null,
      smileScore: item.analysis?.smileScore || null,
      qualityScore: item.analysis?.confidence || null,
    })
  );

  // Use direct fetch for FormData upload (Hono RPC doesn't support FormData well)
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      // Don't set Content-Type - browser will set it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to upload image');
  }

  const result = (await response.json()) as UploadResult;
  return result.data;
};

export function useUploadToStorage({
  projectId,
  onUploadComplete,
  onError,
}: UseUploadToStorageOptions): UseUploadToStorageReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);

  const { getQueue, updateQueueItem } = useUploadStore();

  const uploadMutation = useMutation({
    mutationFn: (item: QueuedFile) => uploadSingleImage(projectId, item),
    onSuccess: (upload) => {
      onUploadComplete?.(upload);
    },
    onError: (error) => {
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
    },
  });

  const uploadImage = useCallback(
    async (item: QueuedFile): Promise<Upload | null> => {
      // Allow both 'completed' and 'synced' status (in case of retry)
      if ((item.status !== 'completed' && item.status !== 'synced') || !item.analysis) {
        return null;
      }

      try {
        updateQueueItem(item.id, item.role, { status: 'uploading' });
        const upload = await uploadMutation.mutateAsync(item);
        // Mark as synced after successful upload
        updateQueueItem(item.id, item.role, { status: 'synced' });
        return upload;
      } catch (error) {
        updateQueueItem(item.id, item.role, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        return null;
      }
    },
    [uploadMutation, updateQueueItem]
  );

  const syncUploadsToServer = useCallback(
    async (role: UploadRole, options?: SyncOptions): Promise<Upload[]> => {
      const queue = getQueue(role);
      const completedItems = queue.filter(
        (item) =>
          item.status === 'completed' &&
          item.analysis &&
          item.analysis.bucket !== 'D' // Don't upload D bucket (rejected) images
      );

      if (completedItems.length === 0) {
        return [];
      }

      setIsSyncing(true);
      setSyncTotal(completedItems.length);
      setSyncProgress(0);

      const uploads: Upload[] = [];
      const effectiveProjectId = options?.projectIdOverride ?? projectId;

      for (let i = 0; i < completedItems.length; i++) {
        const item = completedItems[i];
        try {
          // If override is provided, use uploadSingleImage directly with the new projectId
          if (options?.projectIdOverride) {
            updateQueueItem(item.id, item.role, { status: 'uploading' });
            const upload = await uploadSingleImage(effectiveProjectId, item);
            updateQueueItem(item.id, item.role, { status: 'synced' });
            uploads.push(upload);
            onUploadComplete?.(upload);
          } else {
            const upload = await uploadImage(item);
            if (upload) {
              uploads.push(upload);
            }
          }
        } catch (error) {
          if (options?.projectIdOverride) {
            updateQueueItem(item.id, item.role, {
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed',
            });
            onError?.(error instanceof Error ? error : new Error('Upload failed'));
          }
          // Continue with next item
        }
        setSyncProgress(i + 1);
      }

      setIsSyncing(false);
      setSyncProgress(0);
      setSyncTotal(0);

      return uploads;
    },
    [getQueue, projectId, uploadImage, updateQueueItem, onUploadComplete, onError]
  );

  return {
    uploadImage,
    syncUploadsToServer,
    isSyncing,
    syncProgress,
    syncTotal,
  };
}
