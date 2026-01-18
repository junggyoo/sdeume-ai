import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Project } from '@/features/project/types';
import { DASHBOARD_COPY } from '../constants';

export interface ProcessingIndicatorProps {
  project: Project;
  className?: string;
}

export function ProcessingIndicator({
  project,
  className,
}: ProcessingIndicatorProps) {
  const statusMessage =
    project.status === 'generating'
      ? DASHBOARD_COPY.processing.statusGenerating
      : DASHBOARD_COPY.processing.statusTraining;

  const projectName = project.name ?? '화보';

  return (
    <div
      data-testid="processing-indicator"
      role="status"
      aria-live="polite"
      aria-label={`${projectName} ${statusMessage}`}
      className={cn('flex items-center gap-4', className)}
    >
      <div
        data-testid="processing-animation"
        className="animate-pulse rounded-full bg-white/30 h-12 w-12 flex items-center justify-center"
      >
        <div className="h-8 w-8 rounded-full bg-white/50 animate-ping" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-white">{projectName}</span>
        <span className="text-sm text-white/80">{statusMessage}</span>
      </div>
    </div>
  );
}
