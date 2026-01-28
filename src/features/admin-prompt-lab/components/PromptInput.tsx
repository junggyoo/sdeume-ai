'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface PromptInputProps {
  label: string;
  nodeId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  warning?: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const PromptInput = ({
  label,
  nodeId,
  value,
  onChange,
  placeholder,
  minHeight = '140px',
  warning,
  className,
}: PromptInputProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2">
        {label}
        <Badge variant="secondary" className="text-xs font-mono">
          {nodeId}
        </Badge>
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('font-mono text-sm resize-y', `min-h-[${minHeight}]`)}
        style={{ minHeight }}
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{value.length} chars</span>
        {warning && (
          <span className="text-amber-600">{warning}</span>
        )}
      </div>
    </div>
  );
};
