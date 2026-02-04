import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BATCH_SIZE, splitIntoBatches, processBatchesSequentially } from './route';

/**
 * BATCH_SIZE 상수 및 배치 분할 로직 테스트
 *
 * 배치 크기가 타임아웃을 방지하기 위해 2 이하여야 함을 검증합니다.
 * - 문제: 이미지당 최대 90초 소요, Vercel 타임아웃 300초
 * - 해결: BATCH_SIZE를 2로 줄여 최악의 경우 180초 (40% 안전 마진)
 *
 * 또한 Modal 동시 요청 충돌을 방지하기 위해 배치를 순차적으로 처리합니다.
 * - 문제: 동시 Modal 요청 시 컨테이너 스케일 아웃으로 GPU 경합 발생
 * - 해결: 배치를 순차적으로 처리하여 한 번에 하나의 Modal 요청만 처리
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

  describe('processBatchesSequentially - Modal 동시 요청 충돌 방지', () => {
    let fetchCallOrder: number[];
    let fetchCallTimes: number[];

    beforeEach(() => {
      fetchCallOrder = [];
      fetchCallTimes = [];
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should process batches sequentially, not in parallel', async () => {
      const batches = [2, 2];
      let callIndex = 0;

      const mockFetcher = vi.fn().mockImplementation(async (count: number) => {
        const myIndex = callIndex++;
        fetchCallOrder.push(myIndex);
        fetchCallTimes.push(Date.now());

        // 각 배치가 100ms 지연 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 100));

        return Array.from({ length: count }, (_, i) => ({
          base64: `image-${myIndex}-${i}`,
          content_type: 'image/png',
          width: 512,
          height: 512,
        }));
      });

      const onProgressMock = vi.fn();

      // processBatchesSequentially는 Promise를 반환하므로 타이머 제어 필요
      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: onProgressMock,
        timeoutMs: 300000,
      });

      // 첫 번째 배치 처리 완료까지 진행
      await vi.advanceTimersByTimeAsync(100);

      // 두 번째 배치 처리 완료까지 진행
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      // 순차 처리 확인: 두 번째 호출 시간이 첫 번째 완료 후여야 함
      expect(fetchCallOrder).toEqual([0, 1]);
      expect(fetchCallTimes[1]).toBeGreaterThanOrEqual(fetchCallTimes[0] + 100);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(4); // 2 + 2 = 4 images
    });

    it('should NOT call fetches in parallel (regression test)', async () => {
      const batches = [2, 2];
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      const mockFetcher = vi.fn().mockImplementation(async (count: number) => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

        await new Promise((resolve) => setTimeout(resolve, 100));

        concurrentCalls--;

        return Array.from({ length: count }, () => ({
          base64: 'base64',
          content_type: 'image/png',
          width: 512,
          height: 512,
        }));
      });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(200);
      await resultPromise;

      // 순차 처리 시 동시 호출 수는 최대 1이어야 함
      expect(maxConcurrentCalls).toBe(1);
    });

    it('should continue processing remaining batches when one fails', async () => {
      const batches = [2, 2, 2];
      let callCount = 0;

      const mockFetcher = vi.fn().mockImplementation(async (count: number) => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 두 번째 배치에서 에러 발생
        if (callCount === 2) {
          throw new Error('Modal API error');
        }

        return Array.from({ length: count }, () => ({
          base64: 'base64',
          content_type: 'image/png',
          width: 512,
          height: 512,
        }));
      });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(150);
      const result = await resultPromise;

      // 3번 모두 호출되어야 함 (실패해도 계속 진행)
      expect(mockFetcher).toHaveBeenCalledTimes(3);
      // 2개 성공 (첫 번째 2개 + 세 번째 2개) = 4개
      expect(result.length).toBe(4);
    });

    it('should call onProgress after each successful batch', async () => {
      const batches = [2, 1];
      const onProgressMock = vi.fn();

      const mockFetcher = vi.fn().mockImplementation(async (count: number) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return Array.from({ length: count }, () => ({
          base64: 'base64',
          content_type: 'image/png',
          width: 512,
          height: 512,
        }));
      });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: onProgressMock,
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(100);
      await resultPromise;

      // 각 배치 완료 후 onProgress 호출
      expect(onProgressMock).toHaveBeenCalledTimes(2);
      expect(onProgressMock).toHaveBeenNthCalledWith(1, 2, expect.any(Array));
      expect(onProgressMock).toHaveBeenNthCalledWith(2, 3, expect.any(Array));
    });

    it('should respect timeout for each batch', async () => {
      const batches = [2];

      const mockFetcher = vi.fn().mockImplementation(async () => {
        // 타임아웃보다 오래 걸리는 요청
        await new Promise((resolve) => setTimeout(resolve, 400000));
        return [];
      });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      // 타임아웃까지 진행
      await vi.advanceTimersByTimeAsync(300000);

      const result = await resultPromise;

      // 타임아웃으로 빈 결과
      expect(result.length).toBe(0);
    });

    it('should return empty array when batches is empty', async () => {
      const result = await processBatchesSequentially({
        batches: [],
        fetcher: vi.fn(),
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when all batches fail', async () => {
      const batches = [2, 2];
      const mockFetcher = vi.fn().mockRejectedValue(new Error('API error'));

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      // 에러는 즉시 발생하므로 타이머 불필요
      const result = await resultPromise;

      expect(result).toEqual([]);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should pass correct image array to onProgress callback', async () => {
      const batches = [2];
      const onProgressMock = vi.fn();

      const mockFetcher = vi.fn().mockImplementation(async (count: number) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return Array.from({ length: count }, (_, i) => ({
          base64: `base64-${i}`,
          content_type: 'image/png',
          width: 512,
          height: 512,
        }));
      });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: onProgressMock,
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(50);
      await resultPromise;

      expect(onProgressMock).toHaveBeenCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            base64: 'base64-0',
            contentType: 'image/png',
            width: 512,
            height: 512,
          }),
          expect.objectContaining({
            base64: 'base64-1',
            contentType: 'image/png',
            width: 512,
            height: 512,
          }),
        ])
      );
    });

    it('should pass batchIndex to fetcher for unique seed generation', async () => {
      const batches = [2, 2, 2];
      const receivedBatchIndices: number[] = [];

      const mockFetcher = vi
        .fn()
        .mockImplementation(async (count: number, batchIndex: number) => {
          receivedBatchIndices.push(batchIndex);
          await new Promise((resolve) => setTimeout(resolve, 50));
          return Array.from({ length: count }, () => ({
            base64: 'base64',
            content_type: 'image/png',
            width: 512,
            height: 512,
          }));
        });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(150);
      await resultPromise;

      // fetcher가 각 배치의 인덱스를 순차적으로 받아야 함
      expect(receivedBatchIndices).toEqual([0, 1, 2]);
      expect(mockFetcher).toHaveBeenNthCalledWith(1, 2, 0);
      expect(mockFetcher).toHaveBeenNthCalledWith(2, 2, 1);
      expect(mockFetcher).toHaveBeenNthCalledWith(3, 2, 2);
    });

    it('should allow fetcher to compute unique seed per batch using batchIndex', async () => {
      const batches = [2, 2];
      const baseSeed = 12345;
      const usedSeeds: number[] = [];

      const mockFetcher = vi
        .fn()
        .mockImplementation(async (count: number, batchIndex: number) => {
          // 실제 구현과 동일한 seed 계산 로직
          const batchSeed = baseSeed + batchIndex * BATCH_SIZE * 1000;
          usedSeeds.push(batchSeed);
          await new Promise((resolve) => setTimeout(resolve, 50));
          return Array.from({ length: count }, () => ({
            base64: 'base64',
            content_type: 'image/png',
            width: 512,
            height: 512,
          }));
        });

      const resultPromise = processBatchesSequentially({
        batches,
        fetcher: mockFetcher,
        onProgress: vi.fn(),
        timeoutMs: 300000,
      });

      await vi.advanceTimersByTimeAsync(100);
      await resultPromise;

      // 각 배치가 서로 다른 seed를 사용해야 함 (중복 이미지 방지)
      expect(usedSeeds).toEqual([12345, 12345 + 2 * 1000]); // [12345, 14345]
      expect(usedSeeds[0]).not.toBe(usedSeeds[1]);
    });
  });
});
