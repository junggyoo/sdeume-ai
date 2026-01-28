import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConsoleLog, LogLevel, LogPhase } from '../types';

// =============================================================================
// Constants
// =============================================================================

const MAX_LOGS = 200;
const TIMER_INTERVAL = 250;

// =============================================================================
// useConsoleLog Hook
// =============================================================================

export const useConsoleLog = () => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const addLog = useCallback(
    (level: LogLevel, phase: LogPhase, message: string, payload?: unknown) => {
      setLogs((prev) => {
        const newLog: ConsoleLog = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level,
          phase,
          message,
          payload,
        };
        const updated =
          prev.length >= MAX_LOGS ? [...prev.slice(1), newLog] : [...prev, newLog];
        return updated;
      });

      // Auto-scroll
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    },
    []
  );

  const startTimer = useCallback(() => {
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, TIMER_INTERVAL);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setElapsedTime(0);
    stopTimer();
  }, [stopTimer]);

  const getLogsByPhase = useCallback(
    (phase: LogPhase): ConsoleLog[] => {
      return logs.filter((log) => log.phase === phase);
    },
    [logs]
  );

  return {
    logs,
    elapsedTime,
    scrollRef,
    addLog,
    startTimer,
    stopTimer,
    clearLogs,
    getLogsByPhase,
  };
};
