'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SliderSettingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  isKey?: boolean;
  description?: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const SliderSetting = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  isKey = false,
  description,
  className,
}: SliderSettingProps) => {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs flex justify-between">
        <span className="flex items-center gap-1">
          {label}
          {isKey && <span className="text-amber-600">*</span>}
        </span>
        <span className="font-mono">{value}</span>
      </Label>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
