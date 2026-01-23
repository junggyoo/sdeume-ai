'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import pLimit from 'p-limit';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useUploadStore } from '../store/upload-store';
import type { UploadRole, QueuedFile, Upload } from '../types';

// 동시 업로드 제한 (서버 부하 방지)
const CONCURRENT_UPLOAD_LIMIT = 5;

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

  // 진행률 추적을 위한 ref (클로저 문제 방지)
  const progressRef = useRef(0);

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
      progressRef.current = 0;

      const uploads: Upload[] = [];
      const effectiveProjectId = options?.projectIdOverride ?? projectId;

      // p-limit으로 동시 업로드 수 제한
      const limit = pLimit(CONCURRENT_UPLOAD_LIMIT);

      // 각 파일에 대한 업로드 작업 생성
      const uploadTasks = completedItems.map((item) =>
        limit(async () => {
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
            // Continue with other items (don't throw)
          } finally {
            // 각 파일 완료 시 진행률 업데이트
            progressRef.current += 1;
            setSyncProgress(progressRef.current);
          }
        })
      );

      // 모든 업로드 작업 병렬 실행 (p-limit이 동시성 제한)
      await Promise.all(uploadTasks);

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
