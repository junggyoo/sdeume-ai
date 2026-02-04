import { describe, it, expect } from 'vitest';

import { BATCH_SIZE, splitIntoBatches } from './route';

/**
 * BATCH_SIZE 상수 및 배치 분할 로직 테스트
 *
 * 배치 크기가 타임아웃을 방지하기 위해 2 이하여야 함을 검증합니다.
 * - 문제: 이미지당 최대 90초 소요, Vercel 타임아웃 300초
 * - 해결: BATCH_SIZE를 2로 줄여 최악의 경우 180초 (40% 안전 마진)
 */

describe('prompt-test-generate 배치 분할', () => {
  describe('BATCH_SIZE 상수', () => {
    it('should be 2 to prevent timeout', () => {
      expect(BATCH_SIZE).toBe(2);
    });

    it('should not exceed maximum safe value for Vercel timeout', () => {
      const VERCEL_TIMEOUT_SECONDS = 300;
      const MAX_IMAGE_GENERATION_SECONDS = 90;

      // BATCH_SIZE * 90초 < 300초 이어야 함
      const worstCaseSeconds = BATCH_SIZE * MAX_IMAGE_GENERATION_SECONDS;

      expect(worstCaseSeconds).toBeLessThan(VERCEL_TIMEOUT_SECONDS);
    });
  });

  describe('splitIntoBatches', () => {
    it('should split 6 images into 3 batches when BATCH_SIZE is 2', () => {
      const batches = splitIntoBatches(6, BATCH_SIZE);

      expect(batches).toEqual([2, 2, 2]);
      expect(batches.length).toBe(3);
    });

    it('should handle odd numbers correctly', () => {
      const batches = splitIntoBatches(5, BATCH_SIZE);

      expect(batches).toEqual([2, 2, 1]);
      expect(batches.length).toBe(3);
    });

    it('should handle single image', () => {
      const batches = splitIntoBatches(1, BATCH_SIZE);

      expect(batches).toEqual([1]);
      expect(batches.length).toBe(1);
    });

    it('should handle exact batch size', () => {
      const batches = splitIntoBatches(2, BATCH_SIZE);

      expect(batches).toEqual([2]);
      expect(batches.length).toBe(1);
    });

    it('should handle larger counts', () => {
      const batches = splitIntoBatches(10, BATCH_SIZE);

      expect(batches).toEqual([2, 2, 2, 2, 2]);
      expect(batches.length).toBe(5);
    });

    it('should handle zero count', () => {
      const batches = splitIntoBatches(0, BATCH_SIZE);

      expect(batches).toEqual([]);
      expect(batches.length).toBe(0);
    });

    it('should handle negative count as empty array', () => {
      const batches = splitIntoBatches(-1, BATCH_SIZE);

      expect(batches).toEqual([]);
      expect(batches.length).toBe(0);
    });
  });

  describe('타임아웃 안전성 검증', () => {
    const VERCEL_TIMEOUT_SECONDS = 300;
    const MAX_IMAGE_GENERATION_SECONDS = 90;

    it('should have at least 30% safety margin', () => {
      const worstCaseSeconds = BATCH_SIZE * MAX_IMAGE_GENERATION_SECONDS;
      const safetyMargin = 1 - worstCaseSeconds / VERCEL_TIMEOUT_SECONDS;

      // BATCH_SIZE=2: 180초 / 300초 = 0.6, 즉 40% 안전 마진
      expect(safetyMargin).toBeGreaterThanOrEqual(0.3);
    });

    it('should verify BATCH_SIZE of 4 would exceed timeout', () => {
      const oldBatchSize = 4;
      const worstCaseSeconds = oldBatchSize * MAX_IMAGE_GENERATION_SECONDS;

      // 4 * 90 = 360초 > 300초
      expect(worstCaseSeconds).toBeGreaterThan(VERCEL_TIMEOUT_SECONDS);
    });
  });
});
