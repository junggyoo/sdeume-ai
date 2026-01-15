'use client';

import { cn } from '@/lib/utils';
import { STUDIO_STEPS, type StudioStep } from '../types';
import { Check } from 'lucide-react';

interface StudioStepperProps {
  currentStep: number;
  className?: string;
}

export function StudioStepper({ currentStep, className }: StudioStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {STUDIO_STEPS.map((step, index) => (
          <StepperItem
            key={step.id}
            step={step}
            currentStep={currentStep}
            isLast={index === STUDIO_STEPS.length - 1}
          />
        ))}
      </div>

      {/* Mobile Stepper - Dots */}
      <div className="flex md:hidden items-center justify-center gap-2">
        {STUDIO_STEPS.map((step) => (
          <MobileDot key={step.id} step={step} currentStep={currentStep} />
        ))}
      </div>
    </div>
  );
}

interface StepperItemProps {
  step: StudioStep;
  currentStep: number;
  isLast: boolean;
}

function StepperItem({ step, currentStep, isLast }: StepperItemProps) {
  const isCompleted = currentStep > step.id;
  const isCurrent = currentStep === step.id;
  const isPending = currentStep < step.id;

  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
            isCompleted && 'bg-accent-teal border-accent-teal text-white',
            isCurrent && 'bg-primary-desktop border-primary-desktop text-white',
            isPending && 'bg-white border-gray-300 text-gray-400'
          )}
        >
          {isCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="text-sm font-medium">{step.id}</span>
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            'mt-2 text-xs font-medium text-center',
            isCompleted && 'text-accent-teal',
            isCurrent && 'text-primary-desktop',
            isPending && 'text-gray-400'
          )}
        >
          {step.labelKo}
        </span>
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'flex-1 h-0.5 mx-2 mt-[-20px]',
            currentStep > step.id ? 'bg-accent-teal' : 'bg-gray-200'
          )}
        />
      )}
    </div>
  );
}

interface MobileDotProps {
  step: StudioStep;
  currentStep: number;
}

function MobileDot({ step, currentStep }: MobileDotProps) {
  const isCompleted = currentStep > step.id;
  const isCurrent = currentStep === step.id;

  return (
    <div
      className={cn(
        'transition-all',
        isCurrent && 'w-6 h-2 rounded-full bg-primary-desktop',
        isCompleted && 'w-2 h-2 rounded-full bg-accent-teal',
        !isCurrent && !isCompleted && 'w-2 h-2 rounded-full bg-gray-300'
      )}
    />
  );
}
