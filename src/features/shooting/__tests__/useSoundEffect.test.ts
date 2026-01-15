import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundEffect } from '../hooks/useSoundEffect';

// Mock Audio
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockAudio = vi.fn().mockImplementation(() => ({
  play: mockPlay,
  volume: 1,
  preload: '',
}));

// Store the original Audio constructor
const OriginalAudio = global.Audio;

// Mock useReducedMotion from framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('useSoundEffect', () => {
  beforeEach(() => {
    // Replace global Audio with mock
    global.Audio = mockAudio as unknown as typeof Audio;
    mockPlay.mockClear();
    mockAudio.mockClear();
  });

  afterEach(() => {
    // Restore original Audio
    global.Audio = OriginalAudio;
    vi.clearAllMocks();
  });

  describe('Audio Initialization', () => {
    it('should preload audio on mount', () => {
      renderHook(() => useSoundEffect());

      expect(mockAudio).toHaveBeenCalledWith('/sounds/shutter.mp3');
    });

    it('should set volume to 0.3', () => {
      renderHook(() => useSoundEffect());

      const audioInstance = mockAudio.mock.results[0].value;
      expect(audioInstance.volume).toBeDefined();
    });
  });

  describe('playShutter', () => {
    it('should play shutter sound when called', async () => {
      const { result } = renderHook(() => useSoundEffect());

      await act(async () => {
        result.current.playShutter();
      });

      expect(mockPlay).toHaveBeenCalled();
    });

    it('should handle autoplay blocked gracefully', async () => {
      mockPlay.mockRejectedValueOnce(new Error('Autoplay blocked'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { result } = renderHook(() => useSoundEffect());

      await act(async () => {
        result.current.playShutter();
      });

      // Should not throw, just log
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sound] Autoplay blocked by browser'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Reduced Motion', () => {
    it('should not play when prefersReducedMotion is true', async () => {
      // Re-mock useReducedMotion to return true
      const { useReducedMotion } = await import('framer-motion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useSoundEffect());

      await act(async () => {
        result.current.playShutter();
      });

      expect(mockPlay).not.toHaveBeenCalled();
    });
  });

  describe('Return Value', () => {
    it('should return playShutter function', () => {
      const { result } = renderHook(() => useSoundEffect());

      expect(result.current.playShutter).toBeDefined();
      expect(typeof result.current.playShutter).toBe('function');
    });
  });
});
