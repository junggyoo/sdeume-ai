import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUploadStore } from './upload-store';

describe('upload-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUploadStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock files
  const createMockFiles = (count: number): File[] => {
    return Array.from({ length: count }, (_, i) =>
      new File(['content'], `image${i}.jpg`, { type: 'image/jpeg' })
    );
  };

  describe('addToQueueAsync - Batch Processing', () => {
    it('should add files to queue in batches of 5', async () => {
      const files = createMockFiles(12);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      const queue = useUploadStore.getState().groomQueue;
      expect(queue).toHaveLength(12);
    });

    it('should yield to main thread between batches', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      const files = createMockFiles(12);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      // 12 files = 3 batches of 5, 5, 2
      // Yields between batches: 2 yields (after batch 1 and 2, not after last)
      expect(rafSpy).toHaveBeenCalledTimes(2);
    });

    it('should update state incrementally per batch', async () => {
      const stateUpdates: number[] = [];
      const unsubscribe = useUploadStore.subscribe((state) => {
        stateUpdates.push(state.groomQueue.length);
      });

      const files = createMockFiles(12);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      unsubscribe();

      // Should have incremental updates: 5, 10, 12
      expect(stateUpdates).toContain(5);
      expect(stateUpdates).toContain(10);
      expect(stateUpdates).toContain(12);
    });

    it('should handle empty file array', async () => {
      const result = await useUploadStore.getState().addToQueueAsync([], 'groom');

      expect(result).toEqual([]);
      expect(useUploadStore.getState().groomQueue).toHaveLength(0);
    });

    it('should return all queued items', async () => {
      const files = createMockFiles(7);

      const result = await act(async () => {
        return await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      expect(result).toHaveLength(7);
      result.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('file');
        expect(item).toHaveProperty('role', 'groom');
        expect(item).toHaveProperty('status', 'pending');
        expect(item).toHaveProperty('progress', 0);
        expect(item).toHaveProperty('previewUrl');
      });
    });

    it('should create valid preview URLs for each file', async () => {
      const files = createMockFiles(3);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      const queue = useUploadStore.getState().groomQueue;
      queue.forEach((item) => {
        expect(item.previewUrl).toMatch(/^blob:/);
      });
    });

    it('should work with bride role', async () => {
      const files = createMockFiles(5);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'bride');
      });

      expect(useUploadStore.getState().brideQueue).toHaveLength(5);
      expect(useUploadStore.getState().groomQueue).toHaveLength(0);
    });

    it('should not yield for single batch (5 or fewer files)', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      const files = createMockFiles(5);

      await act(async () => {
        await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      // Only 1 batch, no yield needed
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it('should preserve QueuedFile type structure', async () => {
      const files = createMockFiles(1);

      const [item] = await act(async () => {
        return await useUploadStore.getState().addToQueueAsync(files, 'groom');
      });

      // Verify all required QueuedFile properties exist
      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe('string');
      expect(item.file).toBeInstanceOf(File);
      expect(item.role).toBe('groom');
      expect(item.status).toBe('pending');
      expect(item.progress).toBe(0);
      expect(item.previewUrl).toBeDefined();
      expect(typeof item.previewUrl).toBe('string');
    });
  });

  describe('addToQueue - Synchronous (existing)', () => {
    it('should still work for backward compatibility', () => {
      const files = createMockFiles(3);

      const result = useUploadStore.getState().addToQueue(files, 'groom');

      expect(result).toHaveLength(3);
      expect(useUploadStore.getState().groomQueue).toHaveLength(3);
    });
  });
});
