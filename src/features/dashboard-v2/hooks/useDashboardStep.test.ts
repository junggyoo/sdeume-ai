import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStep } from './useDashboardStep';

describe('useDashboardStep', () => {
  describe('Initial State', () => {
    it('should initialize with "home" step by default', () => {
      const { result } = renderHook(() => useDashboardStep());

      expect(result.current.step).toBe('home');
    });

    it('should accept initial step', () => {
      const { result } = renderHook(() => useDashboardStep('theme'));

      expect(result.current.step).toBe('theme');
    });
  });

  describe('setStep', () => {
    it('should update step to "theme"', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.setStep('theme');
      });

      expect(result.current.step).toBe('theme');
    });

    it('should update step to "shooting"', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.setStep('shooting');
      });

      expect(result.current.step).toBe('shooting');
    });

    it('should update step to "home"', () => {
      const { result } = renderHook(() => useDashboardStep('theme'));

      act(() => {
        result.current.setStep('home');
      });

      expect(result.current.step).toBe('home');
    });
  });

  describe('goToTheme', () => {
    it('should navigate to theme step', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.goToTheme();
      });

      expect(result.current.step).toBe('theme');
    });

    it('should work from shooting step', () => {
      const { result } = renderHook(() => useDashboardStep('shooting'));

      act(() => {
        result.current.goToTheme();
      });

      expect(result.current.step).toBe('theme');
    });
  });

  describe('goToShooting', () => {
    it('should navigate to shooting step', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.goToShooting();
      });

      expect(result.current.step).toBe('shooting');
    });

    it('should work from theme step', () => {
      const { result } = renderHook(() => useDashboardStep('theme'));

      act(() => {
        result.current.goToShooting();
      });

      expect(result.current.step).toBe('shooting');
    });
  });

  describe('goHome', () => {
    it('should navigate to home step', () => {
      const { result } = renderHook(() => useDashboardStep('shooting'));

      act(() => {
        result.current.goHome();
      });

      expect(result.current.step).toBe('home');
    });

    it('should work from theme step', () => {
      const { result } = renderHook(() => useDashboardStep('theme'));

      act(() => {
        result.current.goHome();
      });

      expect(result.current.step).toBe('home');
    });
  });

  describe('Multiple Transitions', () => {
    it('should handle multiple step changes', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.goToTheme();
      });
      expect(result.current.step).toBe('theme');

      act(() => {
        result.current.goToShooting();
      });
      expect(result.current.step).toBe('shooting');

      act(() => {
        result.current.goHome();
      });
      expect(result.current.step).toBe('home');
    });

    it('should handle repeated same step changes', () => {
      const { result } = renderHook(() => useDashboardStep());

      act(() => {
        result.current.goToTheme();
        result.current.goToTheme();
      });

      expect(result.current.step).toBe('theme');
    });
  });

  describe('Return Type', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useDashboardStep());

      expect(result.current).toHaveProperty('step');
      expect(result.current).toHaveProperty('setStep');
      expect(result.current).toHaveProperty('goToTheme');
      expect(result.current).toHaveProperty('goToShooting');
      expect(result.current).toHaveProperty('goHome');
    });

    it('should return functions for navigation', () => {
      const { result } = renderHook(() => useDashboardStep());

      expect(typeof result.current.setStep).toBe('function');
      expect(typeof result.current.goToTheme).toBe('function');
      expect(typeof result.current.goToShooting).toBe('function');
      expect(typeof result.current.goHome).toBe('function');
    });
  });
});
