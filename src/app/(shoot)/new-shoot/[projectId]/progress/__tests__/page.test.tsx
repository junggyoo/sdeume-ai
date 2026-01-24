import { describe, it, expect } from 'vitest';
import type { GenerationStatus } from '@/features/generation/types';

/**
 * Tests for Progress Page Phase Determination Logic
 * These tests verify the new 'preparing_training' status handling
 */
describe('Progress Page Phase Logic', () => {
  describe('determinePhase', () => {
    type Phase = 'loading' | 'training' | 'generating' | 'completed' | 'error';

    /**
     * Updated phase determination function that handles preparing_training status
     * This mirrors the logic in the actual page component
     */
    function determinePhase(
      status: GenerationStatus | undefined,
      isInitialLoading: boolean,
      error: Error | null
    ): Phase {
      if (error) return 'error';

      if (status) {
        switch (status) {
          case 'queued':
          case 'preparing_training':
            // Both queued and preparing_training show as training phase
            // with different progress ranges
            return 'training';
          case 'training':
            return 'training';
          case 'generating':
            return 'generating';
          case 'completed':
            return 'completed';
          case 'failed':
            return 'error';
        }
      }

      if (isInitialLoading) return 'loading';

      return 'loading';
    }

    it('should return training phase for queued status', () => {
      expect(determinePhase('queued', false, null)).toBe('training');
    });

    it('should return training phase for preparing_training status', () => {
      // preparing_training is mapped to training phase for UI continuity
      expect(determinePhase('preparing_training', false, null)).toBe('training');
    });

    it('should return training phase for training status', () => {
      expect(determinePhase('training', false, null)).toBe('training');
    });

    it('should return generating phase for generating status', () => {
      expect(determinePhase('generating', false, null)).toBe('generating');
    });

    it('should return completed phase for completed status', () => {
      expect(determinePhase('completed', false, null)).toBe('completed');
    });

    it('should return error phase for failed status', () => {
      expect(determinePhase('failed', false, null)).toBe('error');
    });

    it('should return error phase when error is present', () => {
      expect(determinePhase('training', false, new Error('Test error'))).toBe('error');
    });

    it('should return loading phase during initial loading', () => {
      expect(determinePhase(undefined, true, null)).toBe('loading');
    });
  });

  describe('calculateProgress for preparing_training', () => {
    type WaitingPhase = 'learning' | 'generating' | 'complete';

    /**
     * Updated progress calculation that accounts for preparing_training
     * Progress breakdown:
     * - queued: 0%
     * - preparing_training: 0-10%
     * - training: 10-50%
     * - generating: 50-100%
     */
    function calculateProgress(
      status: GenerationStatus | undefined,
      startedAt: string | null,
      imagesCount: number,
      totalImages: number = 12
    ): number {
      if (!status) return 0;

      switch (status) {
        case 'queued':
          return 0;

        case 'preparing_training': {
          // preparing_training: 0-10% over ~30 seconds
          if (!startedAt) return 0;
          const elapsed = Date.now() - new Date(startedAt).getTime();
          const preparingDuration = 30000; // 30 seconds expected
          const preparingMaxProgress = 10;
          return Math.min(
            Math.round((elapsed / preparingDuration) * preparingMaxProgress),
            preparingMaxProgress
          );
        }

        case 'training': {
          // training: 10-50% over ~5 minutes
          if (!startedAt) return 10;
          const elapsed = Date.now() - new Date(startedAt).getTime();
          const trainingDuration = 300000; // 5 minutes expected
          const progress = 10 + Math.min(
            (elapsed / trainingDuration) * 40,
            40
          );
          return Math.round(progress);
        }

        case 'generating': {
          // generating: 50-100% based on image count
          const imageProgress = (imagesCount / totalImages) * 50;
          return Math.round(50 + imageProgress);
        }

        case 'completed':
          return 100;

        case 'failed':
          return 0;

        default:
          return 0;
      }
    }

    it('should return 0% for queued status', () => {
      expect(calculateProgress('queued', null, 0)).toBe(0);
    });

    it('should return 0-10% for preparing_training status', () => {
      const startedAt = new Date(Date.now() - 15000).toISOString(); // 15 seconds ago
      const progress = calculateProgress('preparing_training', startedAt, 0);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(10);
    });

    it('should return 5% at halfway through preparing_training', () => {
      const startedAt = new Date(Date.now() - 15000).toISOString(); // 15 seconds ago
      const progress = calculateProgress('preparing_training', startedAt, 0);
      expect(progress).toBe(5);
    });

    it('should return 10% when preparing_training completes (max)', () => {
      const startedAt = new Date(Date.now() - 60000).toISOString(); // 60 seconds ago (exceeds 30s)
      const progress = calculateProgress('preparing_training', startedAt, 0);
      expect(progress).toBe(10);
    });

    it('should return 10-50% for training status', () => {
      const startedAt = new Date(Date.now() - 150000).toISOString(); // 2.5 minutes ago
      const progress = calculateProgress('training', startedAt, 0);
      expect(progress).toBeGreaterThanOrEqual(10);
      expect(progress).toBeLessThanOrEqual(50);
    });

    it('should return 50-100% for generating status based on image count', () => {
      const progress = calculateProgress('generating', null, 6, 12);
      expect(progress).toBe(75); // 50 + (6/12 * 50)
    });

    it('should return 100% for completed status', () => {
      expect(calculateProgress('completed', null, 12)).toBe(100);
    });

    it('should return 0% for failed status', () => {
      expect(calculateProgress('failed', null, 0)).toBe(0);
    });
  });

  describe('UI Messages', () => {
    /**
     * Message mapping for different statuses
     */
    function getStatusMessage(status: GenerationStatus | undefined): string {
      switch (status) {
        case 'queued':
          return '대기 중...';
        case 'preparing_training':
          return '학습 데이터를 최적화하고 있습니다...';
        case 'training':
          return '얼굴을 학습하고 있습니다...';
        case 'generating':
          return '사진을 생성하고 있습니다...';
        case 'completed':
          return '완료!';
        case 'failed':
          return '문제가 발생했습니다';
        default:
          return '준비 중...';
      }
    }

    it('should have preparing_training specific message', () => {
      expect(getStatusMessage('preparing_training')).toBe('학습 데이터를 최적화하고 있습니다...');
    });

    it('should have queued message', () => {
      expect(getStatusMessage('queued')).toBe('대기 중...');
    });

    it('should have training message', () => {
      expect(getStatusMessage('training')).toBe('얼굴을 학습하고 있습니다...');
    });

    it('should have generating message', () => {
      expect(getStatusMessage('generating')).toBe('사진을 생성하고 있습니다...');
    });

    it('should have completed message', () => {
      expect(getStatusMessage('completed')).toBe('완료!');
    });

    it('should have failed message', () => {
      expect(getStatusMessage('failed')).toBe('문제가 발생했습니다');
    });

    it('should have default message for undefined status', () => {
      expect(getStatusMessage(undefined)).toBe('준비 중...');
    });
  });
});

/**
 * Tests for Failed Generation Retry Logic
 * When status is 'failed' but LoRA URLs exist, regenerate should be triggered
 */
describe('Failed Generation Retry Logic', () => {
  describe('shouldTriggerRegenerate', () => {
    interface GenerationData {
      status: GenerationStatus;
      groomLoraUrl: string | null;
      brideLoraUrl: string | null;
    }

    /**
     * Determines if regenerate should be triggered based on generation state
     * Bug fix: When status is 'failed' but LoRA training completed,
     * we should retry image generation automatically
     */
    function shouldTriggerRegenerate(
      generation: GenerationData | null,
      isRegenerateMode: boolean
    ): boolean {
      if (!generation || isRegenerateMode) return false;

      const hasLoraUrls = Boolean(
        generation.groomLoraUrl && generation.brideLoraUrl
      );

      // Case 1: completed with LoRA URLs (existing behavior)
      if (generation.status === 'completed' && hasLoraUrls) {
        return true;
      }

      // Case 2: failed with LoRA URLs (bug fix - retry image generation)
      if (generation.status === 'failed' && hasLoraUrls) {
        return true;
      }

      return false;
    }

    it('should trigger regenerate when status is completed with LoRA URLs', () => {
      const generation: GenerationData = {
        status: 'completed',
        groomLoraUrl: 'https://example.com/groom.safetensors',
        brideLoraUrl: 'https://example.com/bride.safetensors',
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(true);
    });

    it('should trigger regenerate when status is failed with LoRA URLs', () => {
      // Bug reproduction: LoRA training succeeded but image generation failed
      const generation: GenerationData = {
        status: 'failed',
        groomLoraUrl: 'https://example.com/groom.safetensors',
        brideLoraUrl: 'https://example.com/bride.safetensors',
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(true);
    });

    it('should not trigger regenerate when status is failed without LoRA URLs', () => {
      // Training failed before LoRA was created
      const generation: GenerationData = {
        status: 'failed',
        groomLoraUrl: null,
        brideLoraUrl: null,
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(false);
    });

    it('should not trigger regenerate when status is training', () => {
      const generation: GenerationData = {
        status: 'training',
        groomLoraUrl: null,
        brideLoraUrl: null,
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(false);
    });

    it('should not trigger regenerate when already in regenerate mode', () => {
      const generation: GenerationData = {
        status: 'failed',
        groomLoraUrl: 'https://example.com/groom.safetensors',
        brideLoraUrl: 'https://example.com/bride.safetensors',
      };

      expect(shouldTriggerRegenerate(generation, true)).toBe(false);
    });

    it('should not trigger regenerate when only groom LoRA exists', () => {
      const generation: GenerationData = {
        status: 'failed',
        groomLoraUrl: 'https://example.com/groom.safetensors',
        brideLoraUrl: null,
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(false);
    });

    it('should not trigger regenerate when only bride LoRA exists', () => {
      const generation: GenerationData = {
        status: 'failed',
        groomLoraUrl: null,
        brideLoraUrl: 'https://example.com/bride.safetensors',
      };

      expect(shouldTriggerRegenerate(generation, false)).toBe(false);
    });
  });
});
