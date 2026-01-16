import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMovieMaker } from '../hooks/useMovieMaker';
import * as videoRenderer from '../lib/video-renderer';

// Mock video-renderer 모듈
vi.mock('../lib/video-renderer', () => ({
  MOVIE_CONFIG: {
    totalDuration: 15,
    fps: 30,
    totalFrames: 450,
    imageCount: 5,
    framesPerImage: 90,
    transitionFrames: 15,
    outputWidth: 1080,
    outputHeight: 1920,
    videoBitrate: 8_000_000,
  },
  checkWebCodecsSupport: vi.fn(() => true),
  loadImage: vi.fn((url: string) =>
    Promise.resolve({
      width: 1080,
      height: 1620,
      src: url,
    } as HTMLImageElement)
  ),
  generateKenBurnsScenes: vi.fn((count: number) =>
    Array.from({ length: count }, () => ({
      startScale: 1.0,
      endScale: 1.15,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    }))
  ),
  encodeVideo: vi.fn(() => Promise.resolve(new Blob(['mock-video'], { type: 'video/mp4' }))),
}));

// Mocked functions with type safety
const mockCheckWebCodecsSupport = videoRenderer.checkWebCodecsSupport as Mock;
const mockLoadImage = videoRenderer.loadImage as Mock;
const mockGenerateKenBurnsScenes = videoRenderer.generateKenBurnsScenes as Mock;
const mockEncodeVideo = videoRenderer.encodeVideo as Mock;

// Mock URL API
const mockCreateObjectURL = vi.fn(() => 'blob:mock-video-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('useMovieMaker', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg',
    'https://example.com/image5.jpg',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have isProcessing as false initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.isProcessing).toBe(false);
    });

    it('should have progress at 0 initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.progress).toBe(0);
    });

    it('should have videoUrl as null initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.videoUrl).toBeNull();
    });

    it('should have error as null initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.error).toBeNull();
    });

    it('should have isProcessingModalOpen as false initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.isProcessingModalOpen).toBe(false);
    });

    it('should have isPreviewModalOpen as false initially', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.isPreviewModalOpen).toBe(false);
    });

    it('should provide generateMovie function', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(typeof result.current.generateMovie).toBe('function');
    });

    it('should provide cancelGeneration function', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(typeof result.current.cancelGeneration).toBe('function');
    });

    it('should provide downloadVideo function', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(typeof result.current.downloadVideo).toBe('function');
    });

    it('should provide closePreviewModal function', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(typeof result.current.closePreviewModal).toBe('function');
    });
  });

  describe('WebCodecs support check', () => {
    it('should set isSupported to true when WebCodecs is available', () => {
            mockCheckWebCodecsSupport.mockReturnValue(true);

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.isSupported).toBe(true);
    });

    it('should set isSupported to false when WebCodecs is not available', () => {
            mockCheckWebCodecsSupport.mockReturnValue(false);

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('generateMovie', () => {
    it('should not start generation with empty images array', async () => {
            const { result } = renderHook(() => useMovieMaker({ images: [] }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(mockEncodeVideo).not.toHaveBeenCalled();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('images');
    });

    it('should reset error when starting new generation', async () => {
      
      // First call fails
      mockLoadImage.mockRejectedValueOnce(new Error('First load failed'));

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // First generation - should fail
      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.error).not.toBeNull();

      // Reset mock to succeed
      mockLoadImage.mockImplementation((url: string) =>
        Promise.resolve({ width: 1080, height: 1620, src: url } as HTMLImageElement)
      );
      mockEncodeVideo.mockResolvedValue(new Blob(['video'], { type: 'video/mp4' }));

      // Second generation - should succeed and clear error
      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.videoUrl).not.toBeNull();
    });

    it('should set isProcessing to true when called', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      act(() => {
        result.current.generateMovie();
      });

      expect(result.current.isProcessing).toBe(true);
    });

    it('should open processing modal when generation starts', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      act(() => {
        result.current.generateMovie();
      });

      expect(result.current.isProcessingModalOpen).toBe(true);
    });

    it('should load images during asset loading phase', async () => {
            const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(mockLoadImage).toHaveBeenCalledTimes(5);
      mockImages.forEach((url) => {
        expect(mockLoadImage).toHaveBeenCalledWith(url);
      });
    });

    it('should call encodeVideo with loaded images', async () => {
            const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(mockGenerateKenBurnsScenes).toHaveBeenCalledWith(5);
      expect(mockEncodeVideo).toHaveBeenCalled();
    });

    it('should create video URL on completion', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(result.current.videoUrl).toBe('blob:mock-video-url');
    });

    it('should set isProcessing to false on completion', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should close processing modal and open preview modal on completion', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.isProcessingModalOpen).toBe(false);
      expect(result.current.isPreviewModalOpen).toBe(true);
    });

    it('should set progress to 100 on completion', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.progress).toBe(100);
    });

    it('should not start generation if already processing', async () => {
            const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // Start first generation
      act(() => {
        result.current.generateMovie();
      });

      // Try to start second generation (should be ignored)
      act(() => {
        result.current.generateMovie();
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });

      // Should only have called loadImage once per image (5 times total)
      expect(mockLoadImage).toHaveBeenCalledTimes(5);
    });

    it('should not start generation if not supported', async () => {
      mockCheckWebCodecsSupport.mockReturnValue(false);

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(mockEncodeVideo).not.toHaveBeenCalled();
      expect(result.current.error).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error when image loading fails', async () => {
            mockLoadImage.mockRejectedValueOnce(new Error('Image load failed'));

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Image load failed');
    });

    it('should set error when encoding fails', async () => {
            mockEncodeVideo.mockRejectedValueOnce(new Error('Encoding failed'));

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Encoding failed');
    });

    it('should set isProcessing to false when error occurs', async () => {
            mockEncodeVideo.mockRejectedValueOnce(new Error('Encoding failed'));

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should close processing modal when error occurs', async () => {
            mockEncodeVideo.mockRejectedValueOnce(new Error('Encoding failed'));

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.isProcessingModalOpen).toBe(false);
    });
  });

  describe('cancelGeneration', () => {
    it('should set isProcessing to false when cancelled', async () => {
            // Make encodeVideo wait indefinitely
      mockEncodeVideo.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      act(() => {
        result.current.generateMovie();
      });

      // Wait for processing to start
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      act(() => {
        result.current.cancelGeneration();
      });

      // Should be cancelled
      expect(result.current.isProcessing).toBe(false);
    });

    it('should close processing modal when cancelled', async () => {
            mockEncodeVideo.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      act(() => {
        result.current.generateMovie();
      });

      await waitFor(() => {
        expect(result.current.isProcessingModalOpen).toBe(true);
      });

      act(() => {
        result.current.cancelGeneration();
      });

      expect(result.current.isProcessingModalOpen).toBe(false);
    });

    it('should allow retry after cancellation', async () => {
      
      // First call will be cancelled
      let firstResolve: (value: Blob) => void;
      mockEncodeVideo.mockImplementationOnce(
        () =>
          new Promise<Blob>((resolve) => {
            firstResolve = resolve;
          })
      );

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // Start first generation
      act(() => {
        result.current.generateMovie();
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      // Cancel it
      act(() => {
        result.current.cancelGeneration();
      });

      expect(result.current.isProcessing).toBe(false);

      // Reset mock for successful second attempt
      mockEncodeVideo.mockResolvedValueOnce(
        new Blob(['video'], { type: 'video/mp4' })
      );

      // Try again - should work
      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.videoUrl).toBe('blob:mock-video-url');
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('downloadVideo', () => {
    it('should not do anything if videoUrl is null', () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // Create mock anchor
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(
        mockAnchor as unknown as HTMLAnchorElement
      );

      act(() => {
        result.current.downloadVideo();
      });

      expect(mockAnchor.click).not.toHaveBeenCalled();
    });

    it('should trigger download when videoUrl exists', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // Generate video first
      await act(async () => {
        await result.current.generateMovie();
      });

      // Create mock anchor
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {} as CSSStyleDeclaration,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(
        mockAnchor as unknown as HTMLAnchorElement
      );
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as HTMLAnchorElement);

      act(() => {
        result.current.downloadVideo();
      });

      expect(mockAnchor.href).toBe('blob:mock-video-url');
      expect(mockAnchor.download).toContain('sdeume_movie');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('closePreviewModal', () => {
    it('should set isPreviewModalOpen to false', async () => {
      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      // Generate video to open preview modal
      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.isPreviewModalOpen).toBe(true);

      act(() => {
        result.current.closePreviewModal();
      });

      expect(result.current.isPreviewModalOpen).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should revoke video URL on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useMovieMaker({ images: mockImages })
      );

      // Generate video
      await act(async () => {
        await result.current.generateMovie();
      });

      expect(result.current.videoUrl).toBe('blob:mock-video-url');

      // Unmount
      unmount();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-video-url');
    });

    it('should not revoke URL if no video was generated', () => {
      const { unmount } = renderHook(() => useMovieMaker({ images: mockImages }));

      unmount();

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('progress tracking', () => {
    it('should update progress during encoding', async () => {
            let progressCallback: (progress: number) => void;

      mockEncodeVideo.mockImplementation(
        (
          _images: HTMLImageElement[],
          _scenes: unknown[],
          onProgress: (progress: number) => void
        ) => {
          progressCallback = onProgress;
          return new Promise((resolve) => {
            // Simulate progress updates
            setTimeout(() => {
              onProgress(25);
              onProgress(50);
              onProgress(75);
              onProgress(100);
              resolve(new Blob(['video'], { type: 'video/mp4' }));
            }, 0);
          });
        }
      );

      const { result } = renderHook(() => useMovieMaker({ images: mockImages }));

      await act(async () => {
        await result.current.generateMovie();
      });

      // Final progress should be 100
      expect(result.current.progress).toBe(100);
    });
  });
});
