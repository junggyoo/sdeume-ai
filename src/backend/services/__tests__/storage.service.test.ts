// TODO: Fix Supabase mock issues - See docs/testing-strategy.md
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  uploadTrainingImage,
  createTrainingZip,
  uploadGeneratedImage,
} from '../storage.service';

// Mock JSZip
const mockJsZipFile = vi.fn();
const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(['zip content']));
vi.mock('jszip', () => ({
  default: vi.fn(() => ({
    file: mockJsZipFile,
    generateAsync: mockGenerateAsync,
  })),
}));

// Mock p-limit to track concurrency
vi.mock('p-limit', () => ({
  default: (concurrency: number) => {
    const mockLimit = (fn: () => Promise<unknown>) => fn();
    (mockLimit as Record<string, unknown>).concurrency = concurrency;
    return mockLimit;
  },
}));

// Mock Supabase client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  createSignedUrl: mockCreateSignedUrl,
}));

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSupabase = {
  storage: {
    from: mockStorageFrom,
  },
  from: vi.fn(() => ({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        eq: mockEq,
      }),
    }),
  })),
} as unknown as SupabaseClient;

// Mock fetch for ZIP creation
global.fetch = vi.fn();

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadTrainingImage', () => {
    it('should upload image to storage and return public URL', async () => {
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/uploads/project123/groom/abc.jpg' },
      });

      const result = await uploadTrainingImage(
        mockSupabase,
        'user123',
        'project123',
        'groom',
        mockFile
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toContain('https://storage.example.com');
      }
      expect(mockStorageFrom).toHaveBeenCalledWith('sdeume-storage');
    });

    it('should return failure when storage upload fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockUpload.mockResolvedValue({
        error: { message: 'Storage quota exceeded' },
      });

      const result = await uploadTrainingImage(
        mockSupabase,
        'user123',
        'project123',
        'groom',
        mockFile
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('STORAGE_UPLOAD_ERROR');
      }
    });
  });

  // Skip: Complex Supabase mock chain issues - See docs/testing-strategy.md
  describe.skip('createTrainingZip', () => {
    it('should fetch images from uploads table and create ZIP with JSZip', async () => {
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
        { original_url: 'https://example.com/image2.jpg' },
      ];

      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null,
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/training-images/project123/groom/images.zip?token=abc123' },
        error: null,
      });

      const result = await createTrainingZip(
        mockSupabase,
        'project123',
        'groom'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toContain('signed');
        expect(result.data).toContain('images.zip');
      }

      // Verify JSZip was used correctly
      expect(mockJsZipFile).toHaveBeenCalledTimes(2);
      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });

      // Verify fetch was called for each image
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image1.jpg');
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image2.jpg');
    });

    it('should use original image buffer without sharp compression (no double compression)', async () => {
      // This test verifies that images are NOT re-compressed on the server
      // to avoid quality degradation from double compression
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
      ];

      const originalBuffer = new ArrayBuffer(1024);

      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null,
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(originalBuffer),
      });

      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/path' },
        error: null,
      });

      await createTrainingZip(mockSupabase, 'project123', 'groom');

      // Verify the original buffer is used directly (no sharp processing)
      expect(mockJsZipFile).toHaveBeenCalledWith(
        'image_000.jpg',
        expect.any(Buffer)
      );
    });

    it('should process images in parallel with concurrency limit', async () => {
      // Create 20 mock uploads to test parallel processing
      const mockUploads = Array.from({ length: 20 }, (_, i) => ({
        original_url: `https://example.com/image${i}.jpg`,
      }));

      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null,
        }),
      });

      const fetchPromises: Promise<void>[] = [];
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        const promise = new Promise<{ ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }>((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
            });
          }, 10);
        });
        fetchPromises.push(promise as unknown as Promise<void>);
        return promise;
      });

      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/path' },
        error: null,
      });

      const startTime = Date.now();
      await createTrainingZip(mockSupabase, 'project123', 'groom');
      const endTime = Date.now();

      // With parallel processing, 20 images at 10ms each should complete
      // much faster than sequential (200ms vs ~20-40ms with concurrency 10)
      // Allow some margin for test stability
      expect(endTime - startTime).toBeLessThan(150);
      expect(global.fetch).toHaveBeenCalledTimes(20);
    });

    it('should return failure when no images found', async () => {
      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const result = await createTrainingZip(
        mockSupabase,
        'project123',
        'groom'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NO_IMAGES_FOUND');
      }
    });

    it('should return failure when database query fails', async () => {
      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const result = await createTrainingZip(
        mockSupabase,
        'project123',
        'groom'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return failure when image fetch fails', async () => {
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
      ];

      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null,
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await createTrainingZip(
        mockSupabase,
        'project123',
        'groom'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('IMAGE_FETCH_ERROR');
      }
    });

    it('should return signed URL for training ZIP', async () => {
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
      ];

      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockUploads,
          error: null,
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/path?token=xyz789' },
        error: null,
      });

      const result = await createTrainingZip(
        mockSupabase,
        'project123',
        'groom'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toContain('signed');
        expect(result.data).toContain('token=');
      }

      // Verify createSignedUrl was called
      expect(mockCreateSignedUrl).toHaveBeenCalled();
    });
  });

  describe('uploadGeneratedImage', () => {
    it('should process base64 and upload original + thumbnail', async () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl
        .mockReturnValueOnce({
          data: { publicUrl: 'https://storage.example.com/generated/project123/gen123/0_original.webp' },
        })
        .mockReturnValueOnce({
          data: { publicUrl: 'https://storage.example.com/generated/project123/gen123/0_thumbnail.webp' },
        });

      const result = await uploadGeneratedImage(
        mockSupabase,
        'project123',
        'gen123',
        0,
        base64Image
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.originalUrl).toContain('original.webp');
        expect(result.data.thumbnailUrl).toContain('thumbnail.webp');
        expect(result.data.blurHash).toBeDefined();
      }
    });

    it('should return failure when original upload fails', async () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      mockUpload.mockResolvedValue({
        error: { message: 'Upload failed' },
      });

      const result = await uploadGeneratedImage(
        mockSupabase,
        'project123',
        'gen123',
        0,
        base64Image
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('STORAGE_UPLOAD_ERROR');
      }
    });

    it('should return failure for invalid base64 input', async () => {
      const invalidBase64 = 'not-a-valid-base64-string';

      const result = await uploadGeneratedImage(
        mockSupabase,
        'project123',
        'gen123',
        0,
        invalidBase64
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('should return failure when thumbnail upload fails', async () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // First upload (original) succeeds
      mockUpload
        .mockResolvedValueOnce({ error: null })
        // Second upload (thumbnail) fails
        .mockResolvedValueOnce({ error: { message: 'Thumbnail upload failed' } });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/generated/project123/gen123/0_original.webp' },
      });

      const result = await uploadGeneratedImage(
        mockSupabase,
        'project123',
        'gen123',
        0,
        base64Image
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('STORAGE_UPLOAD_ERROR');
      }
    });
  });
});
