'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { STUDIO_STEPS, getStepById } from '../types';

interface UseStudioNavigationProps {
  projectId: string;
  currentStep: number;
}

export function useStudioNavigation({
  projectId,
  currentStep,
}: UseStudioNavigationProps) {
  const router = useRouter();

  const navigateToStep = useCallback(
    (stepId: number) => {
      const step = getStepById(stepId);
      if (step) {
        router.push(`/studio/${projectId}/${step.path}`);
      }
    },
    [projectId, router]
  );

  const goToNext = useCallback(() => {
    const nextStep = currentStep + 1;
    if (nextStep <= STUDIO_STEPS.length) {
      navigateToStep(nextStep);
    }
  }, [currentStep, navigateToStep]);

  const goToPrevious = useCallback(() => {
    const prevStep = currentStep - 1;
    if (prevStep >= 1) {
      navigateToStep(prevStep);
    }
  }, [currentStep, navigateToStep]);

  const canGoNext = currentStep < STUDIO_STEPS.length;
  const canGoPrevious = currentStep > 1;

  const currentStepInfo = getStepById(currentStep);

  return {
    navigateToStep,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    currentStepInfo,
  };
}
