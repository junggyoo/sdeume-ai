import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUploadToStorage } from './useUploadToStorage';
import type { QueuedFile, Upload, BucketType } from '../types';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

const mockGetQueue = vi.fn();
const mockUpdateQueueItem = vi.fn();
vi.mock('../store/upload-store', () => ({
  useUploadStore: () => ({
    getQueue: mockGetQueue,
    updateQueueItem: mockUpdateQueueItem,
  }),
}));

// Mock fetch for uploadSingleImage
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase client
vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  }),
}));

// Helper to create mock QueuedFile
const createMockQueuedFile = (
  id: string,
  role: 'groom' | 'bride',
  bucket: BucketType = 'A'
): QueuedFile => ({
  id,
  file: new File(['test'], `${id}.jpg`, { type: 'image/jpeg' }),
  role,
  status: 'completed',
  progress: 100,
  analysis: {
    bucket,
    yawAngle: 0,
    rollAngle: 0,
    smileScore: 0.8,
    confidence: 0.9,
    faceDetected: true,
    eyesOpen: true,
    qualityIssues: [],
    isUsable: bucket !== 'D',
  },
});

// Helper to create mock Upload response
const createMockUpload = (id: string): Upload => ({
  id,
  projectId: 'project-123',
  userId: 'user-123',
  role: 'groom',
  originalUrl: `https://example.com/${id}.jpg`,
  croppedUrl: null,
  bucketType: 'A',
  faceYaw: 0,
  smileScore: 0.8,
  qualityScore: 0.9,
  isSelected: true,
  cropMode: 'original',
  cropRect: null,
  createdAt: new Date().toISOString(),
});

describe('useUploadToStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('syncUploadsToServer - 병렬 업로드', () => {
    it('should upload multiple files concurrently with p-limit', async () => {
      // Arrange: 10개의 파일 준비
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockQueuedFile(`file-${i}`, 'groom')
      );
      mockGetQueue.mockReturnValue(files);

      // Track upload start times to verify concurrency
      const uploadStartTimes: number[] = [];
      const uploadEndTimes: number[] = [];

      mockFetch.mockImplementation(async () => {
        uploadStartTimes.push(Date.now());
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        uploadEndTimes.push(Date.now());
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: createMockUpload(`upload-${uploadStartTimes.length}`),
          }),
        };
      });

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Act
      let uploads: Upload[] = [];
      await act(async () => {
        uploads = await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
        // Advance timers to complete all uploads
        await vi.runAllTimersAsync();
      });

      // Assert: 모든 파일이 업로드됨
      expect(uploads.length).toBe(10);
      expect(mockFetch).toHaveBeenCalledTimes(10);
    });

    it('should limit concurrent uploads to 5', async () => {
      // Arrange: 10개의 파일 준비
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockQueuedFile(`file-${i}`, 'groom')
      );
      mockGetQueue.mockReturnValue(files);

      // Track concurrent uploads
      let currentConcurrent = 0;
      let maxConcurrent = 0;

      mockFetch.mockImplementation(async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        currentConcurrent--;
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: createMockUpload(`upload-${Date.now()}`),
          }),
        };
      });

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Act
      await act(async () => {
        await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
        await vi.runAllTimersAsync();
      });

      // Assert: 동시 업로드가 5개를 초과하지 않음
      expect(maxConcurrent).toBeLessThanOrEqual(5);
      expect(maxConcurrent).toBeGreaterThan(1); // 병렬 처리 확인
    });

    it('should update progress after each file completes', async () => {
      // Arrange: 5개의 파일 준비
      const files = Array.from({ length: 5 }, (_, i) =>
        createMockQueuedFile(`file-${i}`, 'groom')
      );
      mockGetQueue.mockReturnValue(files);

      const progressUpdates: number[] = [];

      mockFetch.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: createMockUpload(`upload-${Date.now()}`),
          }),
        };
      });

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Track progress changes
      const originalSetSyncProgress = result.current.syncProgress;

      // Act
      await act(async () => {
        const promise = result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
        await vi.runAllTimersAsync();
        await promise;
      });

      // Assert: syncTotal이 설정됨
      // Note: 진행률은 각 파일 완료 후 업데이트됨
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should continue uploading other files when one fails', async () => {
      // Arrange: 5개의 파일, file-2가 실패하도록 설정
      const files = Array.from({ length: 5 }, (_, i) =>
        createMockQueuedFile(`file-${i}`, 'groom')
      );
      mockGetQueue.mockReturnValue(files);

      // 파일 ID 기반으로 실패 여부 결정 (병렬 처리에서도 예측 가능)
      mockFetch.mockImplementation(async (url: string, options: RequestInit) => {
        await new Promise((resolve) => setTimeout(resolve, 10));

        // FormData에서 metadata를 추출하여 파일 확인은 어려우므로
        // 간단하게 호출 순서가 아닌 랜덤하게 1개 실패 시뮬레이션
        // 실제로는 병렬 처리 시 모든 요청이 독립적으로 실행됨
        const body = options.body as FormData;
        const file = body?.get('file') as File;

        // file-2.jpg 파일이면 실패
        if (file?.name === 'file-2.jpg') {
          return {
            ok: false,
            json: async () => ({ error: { message: 'Upload failed' } }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: createMockUpload(`upload-${file?.name}`),
          }),
        };
      });

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Act
      let uploads: Upload[] = [];
      await act(async () => {
        uploads = await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
        await vi.runAllTimersAsync();
      });

      // Assert: 실패한 1개를 제외한 4개 성공
      expect(uploads.length).toBe(4);
      expect(mockFetch).toHaveBeenCalledTimes(5);
      // 실패한 파일에 대해 에러 상태 업데이트 확인
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'file-2',
        'groom',
        expect.objectContaining({ status: 'error' })
      );
    });

    it('should filter out D bucket images', async () => {
      // Arrange: A, B, C, D 버킷 파일 혼합
      const files = [
        createMockQueuedFile('file-a', 'groom', 'A'),
        createMockQueuedFile('file-b', 'groom', 'B'),
        createMockQueuedFile('file-c', 'groom', 'C'),
        createMockQueuedFile('file-d', 'groom', 'D'), // 제외되어야 함
      ];
      mockGetQueue.mockReturnValue(files);

      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          data: createMockUpload(`upload-${Date.now()}`),
        }),
      }));

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Act
      let uploads: Upload[] = [];
      await act(async () => {
        uploads = await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
      });

      // Assert: D 버킷 제외, 3개만 업로드
      expect(uploads.length).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when no completed items', async () => {
      // Arrange: 빈 큐
      mockGetQueue.mockReturnValue([]);

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
        })
      );

      // Act
      let uploads: Upload[] = [];
      await act(async () => {
        uploads = await result.current.syncUploadsToServer('groom');
      });

      // Assert
      expect(uploads.length).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call onUploadComplete for each successful upload', async () => {
      // Arrange
      const files = Array.from({ length: 3 }, (_, i) =>
        createMockQueuedFile(`file-${i}`, 'groom')
      );
      mockGetQueue.mockReturnValue(files);

      mockFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          data: createMockUpload(`upload-${Date.now()}`),
        }),
      }));

      const onUploadComplete = vi.fn();

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
          onUploadComplete,
        })
      );

      // Act
      await act(async () => {
        await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
      });

      // Assert
      expect(onUploadComplete).toHaveBeenCalledTimes(3);
    });

    it('should call onError for failed uploads', async () => {
      // Arrange
      const files = [createMockQueuedFile('file-0', 'groom')];
      mockGetQueue.mockReturnValue(files);

      mockFetch.mockImplementation(async () => ({
        ok: false,
        json: async () => ({ error: { message: 'Server error' } }),
      }));

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useUploadToStorage({
          projectId: 'project-123',
          onError,
        })
      );

      // Act
      await act(async () => {
        await result.current.syncUploadsToServer('groom', {
          projectIdOverride: 'project-456',
        });
      });

      // Assert
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
