import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkUpload } from './useBulkUpload';
import { useUploadStore } from '../store/upload-store';
import { rotateImage90 } from '../lib/rotate-image';
import { processImage } from '../lib/image-processor';
import { analyzeFaceFromFile, detectRotationFromFile } from '../lib/face-mesh';
import type { QueuedFile, FaceAnalysisResult } from '../types';

// Mock dependencies at module level
vi.mock('../store/upload-store');
vi.mock('../lib/rotate-image', () => ({
  rotateImage90: vi.fn(),
}));
vi.mock('../lib/image-processor', () => ({
  processImage: vi.fn(),
}));
vi.mock('../lib/face-mesh', () => ({
  analyzeFaceFromFile: vi.fn(),
  detectRotationFromFile: vi.fn(),
}));

// Helper to create mock FaceAnalysisResult matching actual type
const createMockAnalysis = (overrides: Partial<FaceAnalysisResult> = {}): FaceAnalysisResult => ({
  faceDetected: true,
  yawAngle: 0,
  rollAngle: 0,
  smileScore: 0.5,
  eyesOpen: true,
  bucket: 'D',
  confidence: 0.8,
  qualityIssues: [],
  isUsable: false,
  ...overrides,
});

// Helper to create mock QueuedFile
const createMockQueuedFile = (overrides: Partial<QueuedFile> = {}): QueuedFile => ({
  id: 'test-id-1',
  file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
  role: 'groom',
  status: 'completed',
  progress: 100,
  previewUrl: 'blob:test-preview-url',
  analysis: createMockAnalysis(),
  ...overrides,
});

// Mock store functions
const mockGetQueue = vi.fn();
const mockAddToQueueAsync = vi.fn();
const mockUpdateQueueItem = vi.fn();
const mockRemoveFromQueue = vi.fn();
const mockClearQueue = vi.fn();
const mockGetBucketSummary = vi.fn();

describe('useBulkUpload - rotateImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset URL mock
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:new-preview-url');
    global.URL.revokeObjectURL = vi.fn();

    // Setup store mock
    mockGetBucketSummary.mockReturnValue({
      bucketA: 0,
      bucketB: 0,
      bucketC: 0,
      bucketD: 0,
      total: 0,
      usableCount: 0,
    });

    mockGetQueue.mockReturnValue([]);

    vi.mocked(useUploadStore).mockReturnValue({
      getQueue: mockGetQueue,
      addToQueueAsync: mockAddToQueueAsync,
      updateQueueItem: mockUpdateQueueItem,
      removeFromQueue: mockRemoveFromQueue,
      clearQueue: mockClearQueue,
      getBucketSummary: mockGetBucketSummary,
    } as unknown as ReturnType<typeof useUploadStore>);

    // Setup face-mesh mocks
    vi.mocked(detectRotationFromFile).mockResolvedValue({
      needsRotation: false,
      correctionDegrees: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rotateImage function', () => {
    it('should return rotateImage function in the hook return value', () => {
      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      expect(result.current.rotateImage).toBeDefined();
      expect(typeof result.current.rotateImage).toBe('function');
    });

    it('should set status to analyzing when rotation starts', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // First call should set status to 'analyzing'
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({ status: 'analyzing' })
      );
    });

    it('should call rotateImage90 with correct parameters', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      expect(rotateImage90).toHaveBeenCalledWith(mockItem.file, 90);
    });

    it('should call processImage after rotation', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      const rotatedFile = new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' });
      vi.mocked(rotateImage90).mockResolvedValue(rotatedFile);
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      expect(processImage).toHaveBeenCalledWith(rotatedFile);
    });

    it('should update previewUrl after rotation', async () => {
      const mockItem = createMockQueuedFile({
        id: 'item-1',
        status: 'completed',
        previewUrl: 'blob:old-preview-url'
      });
      mockGetQueue.mockReturnValue([mockItem]);

      const rotatedFile = new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' });
      vi.mocked(rotateImage90).mockResolvedValue(rotatedFile);
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should have called URL.createObjectURL for new preview
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Should update with new previewUrl
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({ previewUrl: expect.any(String) })
      );
    });

    it('should re-analyze face after rotation and update with new result', async () => {
      const mockItem = createMockQueuedFile({
        id: 'item-1',
        status: 'completed',
        analysis: createMockAnalysis({
          bucket: 'D',
          faceDetected: false,
          isUsable: false,
          rejectionReason: 'no_face',
        })
      });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });

      // After rotation, face is now detected and classified as bucket A
      const newAnalysis = createMockAnalysis({
        bucket: 'A',
        faceDetected: true,
        yawAngle: 5,
        confidence: 0.95,
        isUsable: true,
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(newAnalysis);

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should call analyzeFaceFromFile
      expect(analyzeFaceFromFile).toHaveBeenCalled();

      // Final update should include new analysis with rotation info
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          status: 'completed',
          progress: 100,
          analysis: expect.objectContaining({
            bucket: 'A',
            wasRotated: true,
            rotationApplied: 90,
          }),
        })
      );
    });

    it('should set status to error when rotation fails', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockRejectedValue(new Error('Rotation failed'));

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should update status to error
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          status: 'error',
          error: '회전 처리에 실패했습니다',
        })
      );
    });

    it('should set status to error when processImage fails', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockRejectedValue(new Error('Processing failed'));

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should update status to error
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          status: 'error',
          error: '회전 처리에 실패했습니다',
        })
      );
    });

    it('should set status to error when analyzeFaceFromFile fails', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockRejectedValue(new Error('Face analysis failed'));

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should update status to error
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          status: 'error',
          error: '회전 처리에 실패했습니다',
        })
      );
    });

    it('should not rotate when item is already in analyzing status', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'analyzing' });
      mockGetQueue.mockReturnValue([mockItem]);

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should not call rotateImage90
      expect(rotateImage90).not.toHaveBeenCalled();
      // Should not update anything
      expect(mockUpdateQueueItem).not.toHaveBeenCalled();
    });

    it('should not rotate when item does not exist', async () => {
      mockGetQueue.mockReturnValue([]);

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('non-existent-id', 90);
      });

      // Should not call rotateImage90
      expect(rotateImage90).not.toHaveBeenCalled();
      // Should not update anything
      expect(mockUpdateQueueItem).not.toHaveBeenCalled();
    });

    it('should revoke old previewUrl to prevent memory leak', async () => {
      const oldPreviewUrl = 'blob:old-preview-url';
      const mockItem = createMockQueuedFile({
        id: 'item-1',
        status: 'completed',
        previewUrl: oldPreviewUrl
      });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should revoke old URL
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(oldPreviewUrl);
    });

    it('should not call revokeObjectURL when previewUrl is undefined', async () => {
      const mockItem = createMockQueuedFile({
        id: 'item-1',
        status: 'completed',
        previewUrl: undefined
      });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should not call revokeObjectURL with undefined
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith(undefined);
    });

    it('should support counter-clockwise rotation (-90 degrees)', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );
      vi.mocked(processImage).mockResolvedValue({
        file: new File(['processed'], 'processed.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'B', yawAngle: 45, isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', -90);
      });

      // Should call rotateImage90 with -90
      expect(rotateImage90).toHaveBeenCalledWith(mockItem.file, -90);

      // Final analysis should have rotationApplied as -90
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          analysis: expect.objectContaining({
            rotationApplied: -90,
          }),
        })
      );
    });

    it('should not rotate when item status is pending', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'pending' });
      mockGetQueue.mockReturnValue([mockItem]);

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Should not call rotateImage90 for pending items (let initial processing complete first)
      expect(rotateImage90).not.toHaveBeenCalled();
    });

    it('should update file in QueuedFile after rotation', async () => {
      const mockItem = createMockQueuedFile({ id: 'item-1', status: 'completed' });
      mockGetQueue.mockReturnValue([mockItem]);

      vi.mocked(rotateImage90).mockResolvedValue(
        new File(['rotated'], 'rotated.jpg', { type: 'image/jpeg' })
      );

      const processedFile = new File(['processed'], 'processed.jpg', { type: 'image/jpeg' });
      vi.mocked(processImage).mockResolvedValue({
        file: processedFile,
        previewUrl: 'blob:processed-url',
      });
      vi.mocked(analyzeFaceFromFile).mockResolvedValue(
        createMockAnalysis({ bucket: 'A', isUsable: true })
      );

      const { result } = renderHook(() =>
        useBulkUpload({ projectId: 'test-project', role: 'groom' })
      );

      await act(async () => {
        await result.current.rotateImage('item-1', 90);
      });

      // Final update should include the new file
      expect(mockUpdateQueueItem).toHaveBeenCalledWith(
        'item-1',
        'groom',
        expect.objectContaining({
          file: processedFile,
        })
      );
    });
  });
});
