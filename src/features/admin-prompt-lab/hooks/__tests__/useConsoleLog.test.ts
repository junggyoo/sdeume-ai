import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsoleLog } from '../useConsoleLog';

// =============================================================================
// Tests for useConsoleLog Hook
// =============================================================================

describe('useConsoleLog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addLog', () => {
    it('should add a log with correct structure', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Test message');
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toMatchObject({
        level: 'info',
        phase: 'config',
        message: 'Test message',
      });
      expect(result.current.logs[0].id).toBeDefined();
      expect(result.current.logs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should add a log with payload', () => {
      const { result } = renderHook(() => useConsoleLog());
      const payload = { theme: 'white_studio', shotType: 'full_body' };

      act(() => {
        result.current.addLog('info', 'config', 'Theme loaded', payload);
      });

      expect(result.current.logs[0].payload).toEqual(payload);
    });

    it('should support all log levels', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Info message');
        result.current.addLog('success', 'result', 'Success message');
        result.current.addLog('warning', 'progress', 'Warning message');
        result.current.addLog('error', 'result', 'Error message');
      });

      expect(result.current.logs).toHaveLength(4);
      expect(result.current.logs.map((l) => l.level)).toEqual([
        'info',
        'success',
        'warning',
        'error',
      ]);
    });

    it('should support all log phases', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Config log');
        result.current.addLog('info', 'progress', 'Progress log');
        result.current.addLog('success', 'result', 'Result log');
      });

      expect(result.current.logs.map((l) => l.phase)).toEqual([
        'config',
        'progress',
        'result',
      ]);
    });

    it('should limit logs to MAX_LOGS (200)', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        // Add 210 logs
        for (let i = 0; i < 210; i++) {
          result.current.addLog('info', 'progress', `Log ${i}`);
        }
      });

      expect(result.current.logs).toHaveLength(200);
      // First 10 logs should be removed (logs 0-9), so first remaining is "Log 10"
      expect(result.current.logs[0].message).toBe('Log 10');
      expect(result.current.logs[199].message).toBe('Log 209');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Log 1');
        result.current.addLog('info', 'config', 'Log 2');
      });

      expect(result.current.logs).toHaveLength(2);

      act(() => {
        result.current.clearLogs();
      });

      expect(result.current.logs).toHaveLength(0);
    });

    it('should reset elapsed time when clearing logs', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.elapsedTime).toBeGreaterThan(0);

      act(() => {
        result.current.clearLogs();
      });

      expect(result.current.elapsedTime).toBe(0);
    });
  });

  describe('timer functions', () => {
    it('should start timer and update elapsed time', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.elapsedTime).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.elapsedTime).toBeGreaterThanOrEqual(250);
    });

    it('should update elapsed time at 250ms intervals', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
      });

      // Advance by 250ms
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.elapsedTime).toBeGreaterThanOrEqual(250);

      // Advance by another 250ms
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.elapsedTime).toBeGreaterThanOrEqual(500);
    });

    it('should stop timer', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(500);
      });

      const elapsedBeforeStop = result.current.elapsedTime;

      act(() => {
        result.current.stopTimer();
        vi.advanceTimersByTime(500);
      });

      // Elapsed time should not change after stop
      expect(result.current.elapsedTime).toBe(elapsedBeforeStop);
    });

    it('should reset elapsed time when starting timer again', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.elapsedTime).toBeGreaterThan(500);

      act(() => {
        result.current.startTimer();
      });

      expect(result.current.elapsedTime).toBe(0);
    });
  });

  describe('scrollRef', () => {
    it('should provide a ref for auto-scroll', () => {
      const { result } = renderHook(() => useConsoleLog());

      expect(result.current.scrollRef).toBeDefined();
      expect(result.current.scrollRef.current).toBeNull();
    });
  });

  describe('log ID uniqueness', () => {
    it('should generate unique IDs for each log', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Log 1');
        result.current.addLog('info', 'config', 'Log 2');
        result.current.addLog('info', 'config', 'Log 3');
      });

      const ids = result.current.logs.map((l) => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('cleanup on unmount', () => {
    it('should cleanup timer on unmount', () => {
      const { result, unmount } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
      });

      unmount();

      // Timer should be cleared, no errors should occur
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // If interval wasn't cleared, this would cause issues
    });
  });

  describe('edge cases', () => {
    it('should handle stopTimer when timer is not started', () => {
      const { result } = renderHook(() => useConsoleLog());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.stopTimer();
        });
      }).not.toThrow();
    });

    it('should return empty array for getLogsByPhase with no matching logs', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Config log');
      });

      expect(result.current.getLogsByPhase('result')).toEqual([]);
    });

    it('should stop timer when clearLogs is called while timer is running', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.startTimer();
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.clearLogs();
      });

      const elapsedAfterClear = result.current.elapsedTime;

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Timer should be stopped, elapsed time should not increase
      expect(result.current.elapsedTime).toBe(elapsedAfterClear);
    });
  });

  describe('getLogsByPhase', () => {
    it('should filter logs by phase', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.addLog('info', 'config', 'Config 1');
        result.current.addLog('info', 'config', 'Config 2');
        result.current.addLog('info', 'progress', 'Progress 1');
        result.current.addLog('success', 'result', 'Result 1');
      });

      const configLogs = result.current.getLogsByPhase('config');
      const progressLogs = result.current.getLogsByPhase('progress');
      const resultLogs = result.current.getLogsByPhase('result');

      expect(configLogs).toHaveLength(2);
      expect(progressLogs).toHaveLength(1);
      expect(resultLogs).toHaveLength(1);
    });
  });

  describe('complex scenarios', () => {
    it('should handle typical generation workflow', () => {
      const { result } = renderHook(() => useConsoleLog());

      // Simulate generation workflow
      act(() => {
        result.current.clearLogs();
        result.current.startTimer();
      });

      // CONFIG phase
      act(() => {
        result.current.addLog('info', 'config', 'Theme: White Studio (Full Body)', {
          theme: 'white_studio',
          shotType: 'full_body',
          seed: 12345,
        });
        result.current.addLog('info', 'config', 'Size: 896 × 1152', {
          width: 896,
          height: 1152,
        });
      });

      // PROGRESS phase
      act(() => {
        result.current.addLog('info', 'progress', 'Validating inputs...');
        result.current.addLog('info', 'progress', 'Assembling prompts...');
        result.current.addLog('info', 'progress', 'Calling Modal API...', {
          requestBody: { themeSlug: 'white_studio' },
        });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // RESULT phase
      act(() => {
        result.current.addLog('success', 'progress', 'Response received');
        result.current.addLog('success', 'result', 'Generation completed (1.0s)', {
          testId: 'test-123',
          seed: 12345,
        });
        result.current.stopTimer();
      });

      // Verify logs
      expect(result.current.logs).toHaveLength(7);
      expect(result.current.getLogsByPhase('config')).toHaveLength(2);
      expect(result.current.getLogsByPhase('progress')).toHaveLength(4);
      expect(result.current.getLogsByPhase('result')).toHaveLength(1);
    });

    it('should handle error scenario', () => {
      const { result } = renderHook(() => useConsoleLog());

      act(() => {
        result.current.clearLogs();
        result.current.startTimer();
        result.current.addLog('info', 'config', 'Theme: White Studio');
        result.current.addLog('info', 'progress', 'Calling Modal API...');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.addLog('error', 'result', 'Generation failed: Timeout', {
          error: 'Timeout',
          statusCode: 504,
        });
        result.current.stopTimer();
      });

      const resultLogs = result.current.getLogsByPhase('result');
      expect(resultLogs).toHaveLength(1);
      expect(resultLogs[0].level).toBe('error');
      expect(resultLogs[0].payload).toEqual({
        error: 'Timeout',
        statusCode: 504,
      });
    });
  });
});
