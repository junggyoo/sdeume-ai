import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadImage,
  downloadAllImages,
  generateFilename,
} from '../utils/download';
import type { GenerationImage } from '@/features/generation/types';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL API
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock DOM
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {} as CSSStyleDeclaration,
};

describe('download utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock-image-data'])),
    });

    vi.spyOn(document, 'createElement').mockReturnValue(
      mockAnchorElement as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchorElement as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchorElement as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateFilename', () => {
    it('should generate filename with zero-padded index', () => {
      const filename = generateFilename(0);
      expect(filename).toBe('sdeume_001.jpg');
    });

    it('should generate filename with correct index padding', () => {
      const filename = generateFilename(9);
      expect(filename).toBe('sdeume_010.jpg');
    });

    it('should include projectId when provided', () => {
      const filename = generateFilename(0, 'abc123');
      expect(filename).toBe('sdeume_abc123_001.jpg');
    });

    it('should handle large index numbers', () => {
      const filename = generateFilename(99);
      expect(filename).toBe('sdeume_100.jpg');
    });
  });

  describe('downloadImage', () => {
    it('should fetch image and trigger download', async () => {
      const url = 'https://example.com/image.jpg';
      const filename = 'test-image.jpg';

      await downloadImage(url, filename);

      expect(mockFetch).toHaveBeenCalledWith(url);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchorElement.href).toBe('blob:mock-url');
      expect(mockAnchorElement.download).toBe(filename);
      expect(mockAnchorElement.click).toHaveBeenCalled();
    });

    it('should cleanup object URL after download', async () => {
      await downloadImage('https://example.com/image.jpg', 'test.jpg');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should throw error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        downloadImage('https://example.com/not-found.jpg', 'test.jpg')
      ).rejects.toThrow('Failed to download image: 404 Not Found');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        downloadImage('https://example.com/image.jpg', 'test.jpg')
      ).rejects.toThrow('Network error');
    });
  });

  describe('downloadAllImages', () => {
    const mockImages: GenerationImage[] = [
      { url: 'https://example.com/image1.jpg', is_blur: false },
      { url: 'https://example.com/image2.jpg', is_blur: false },
      { url: 'https://example.com/image3.jpg', is_blur: false },
    ];

    it('should download all images sequentially', async () => {
      await downloadAllImages(mockImages);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://example.com/image1.jpg'
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://example.com/image2.jpg'
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        'https://example.com/image3.jpg'
      );
    });

    it('should generate correct filenames for each image', async () => {
      const downloads: string[] = [];
      mockAnchorElement.click = vi.fn(() => {
        downloads.push(mockAnchorElement.download);
      });

      await downloadAllImages(mockImages);

      expect(downloads).toEqual([
        'sdeume_001.jpg',
        'sdeume_002.jpg',
        'sdeume_003.jpg',
      ]);
    });

    it('should include projectId in filenames when provided', async () => {
      const downloads: string[] = [];
      mockAnchorElement.click = vi.fn(() => {
        downloads.push(mockAnchorElement.download);
      });

      await downloadAllImages(mockImages, 'proj123');

      expect(downloads).toEqual([
        'sdeume_proj123_001.jpg',
        'sdeume_proj123_002.jpg',
        'sdeume_proj123_003.jpg',
      ]);
    });

    it('should handle empty images array', async () => {
      await downloadAllImages([]);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should continue downloading even if one fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['data1'])),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['data3'])),
        });

      const result = await downloadAllImages(mockImages);

      // Should attempt all downloads
      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Should return count of successful downloads
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
    });

    it('should add delay between downloads to avoid browser limits', async () => {
      vi.useFakeTimers();

      const downloadPromise = downloadAllImages(mockImages);

      // Fast-forward through delays
      await vi.runAllTimersAsync();
      await downloadPromise;

      vi.useRealTimers();

      // Verify all downloads were attempted
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
