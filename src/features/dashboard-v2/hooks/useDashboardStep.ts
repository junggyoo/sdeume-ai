import { useState, useCallback } from 'react';
import type { DashboardStep, UseDashboardStepReturn } from '../types';

/**
 * 대시보드 단계 관리 Hook
 *
 * @param initialStep 초기 단계 (기본값: 'home')
 * @returns 현재 단계 및 네비게이션 함수들
 */
export function useDashboardStep(
  initialStep: DashboardStep = 'home'
): UseDashboardStepReturn {
  const [step, setStepState] = useState<DashboardStep>(initialStep);

  const setStep = useCallback((newStep: DashboardStep) => {
    setStepState(newStep);
  }, []);

  const goToTheme = useCallback(() => {
    setStepState('theme');
  }, []);

  const goToShooting = useCallback(() => {
    setStepState('shooting');
  }, []);

  const goHome = useCallback(() => {
    setStepState('home');
  }, []);

  return {
    step,
    setStep,
    goToTheme,
    goToShooting,
    goHome,
  };
}
