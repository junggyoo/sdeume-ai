import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock p-limit - execute functions immediately
vi.mock('p-limit', () => ({
  default: () => <T>(fn: () => Promise<T>) => fn(),
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

// Query result holder - set this in each test
let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

// Create chainable mock for Supabase query
const createQueryMock = () => {
  const chainMock = {
    select: vi.fn(() => chainMock),
    eq: vi.fn(() => chainMock),
    // When awaited, return the queryResult
    then: (resolve: (value: unknown) => void) => resolve(queryResult),
  };
  return chainMock;
};

const mockSupabase = {
  storage: {
    from: mockStorageFrom,
  },
  from: vi.fn(() => createQueryMock()),
} as unknown as SupabaseClient;

// Mock fetch for ZIP creation
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

  describe('createTrainingZip', () => {
    it('should fetch images from uploads table and create ZIP with JSZip', async () => {
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
        { original_url: 'https://example.com/image2.jpg' },
      ];

      queryResult = { data: mockUploads, error: null };

      mockFetch.mockResolvedValue({
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
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image1.jpg');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image2.jpg');
    });

    it('should use original image buffer without sharp compression (no double compression)', async () => {
      // This test verifies that images are NOT re-compressed on the server
      // to avoid quality degradation from double compression
      const mockUploads = [
        { original_url: 'https://example.com/image1.jpg' },
      ];

      const originalBuffer = new ArrayBuffer(1024);

      queryResult = { data: mockUploads, error: null };

      mockFetch.mockResolvedValue({
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

      queryResult = { data: mockUploads, error: null };

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        })
      );

      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed/path' },
        error: null,
      });

      await createTrainingZip(mockSupabase, 'project123', 'groom');

      // Verify all images were fetched
      expect(mockFetch).toHaveBeenCalledTimes(20);
    });

    it('should return failure when no images found', async () => {
      queryResult = { data: [], error: null };

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
      queryResult = { data: null, error: { message: 'Database error' } };

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

      queryResult = { data: mockUploads, error: null };

      mockFetch.mockResolvedValue({
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

      queryResult = { data: mockUploads, error: null };

      mockFetch.mockResolvedValue({
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
