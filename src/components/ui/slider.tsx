'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Simple Slider Component (No Radix dependency)
// =============================================================================

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onChange, min = 0, max = 100, step = 1, disabled, className }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn('relative w-full h-5 flex items-center', className)}>
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
        {/* Track fill */}
        <div
          className="absolute h-2 rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
        {/* Native input (transparent, for interaction) */}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={cn(
            'absolute w-full h-2 appearance-none cursor-pointer bg-transparent z-10',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-primary',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-white',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-primary',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-white',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-track]:bg-transparent',
            '[&::-webkit-slider-runnable-track]:bg-transparent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
