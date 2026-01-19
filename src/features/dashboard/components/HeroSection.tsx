'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import type { Project } from '@/features/project/types';
import type { DashboardState } from '../types';
import { DASHBOARD_COPY } from '../constants';
import { ProcessingIndicator } from './ProcessingIndicator';

export interface HeroSectionProps {
  state: DashboardState;
  processingProject: Project | null;
  onCreateProject?: () => void;
  isCreatingProject?: boolean;
  className?: string;
}

export function HeroSection({
  state,
  processingProject,
  onCreateProject,
  isCreatingProject = false,
  className,
}: HeroSectionProps) {
  const content = getContentByState(state);

  return (
    <section
      data-testid="hero-section"
      role="region"
      aria-label="대시보드 히어로 섹션"
      className={cn(
        'rounded-xl bg-gradient-to-r from-violet-900/80 to-slate-800 border border-slate-700 p-6 md:p-8 text-white',
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{content.title}</h2>
          <p className="mt-2 text-white/80">{content.subtitle}</p>
        </div>

        {state === 'processing' && processingProject && (
          <Link
            href={`/new-shoot/${processingProject.id}/progress`}
            aria-label="상세 보기"
            className="flex items-center justify-between cursor-pointer rounded-lg p-3 -mx-3 hover:bg-white/10 transition-colors"
          >
            <ProcessingIndicator project={processingProject} />
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-sm">상세 보기</span>
              <ChevronRight
                data-testid="processing-card-chevron"
                className="w-5 h-5"
              />
            </div>
          </Link>
        )}

        {state !== 'processing' && content.ctaLabel && (
          <div className="mt-2">
            <Button
              onClick={onCreateProject}
              disabled={isCreatingProject}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              {isCreatingProject ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {content.ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

interface HeroContent {
  title: string;
  subtitle: string;
  ctaLabel?: string;
}

function getContentByState(state: DashboardState): HeroContent {
  switch (state) {
    case 'onboarding':
      return {
        title: DASHBOARD_COPY.onboarding.title,
        subtitle: DASHBOARD_COPY.onboarding.subtitle,
        ctaLabel: DASHBOARD_COPY.onboarding.ctaButton,
      };
    case 'processing':
      return {
        title: DASHBOARD_COPY.processing.title,
        subtitle: DASHBOARD_COPY.processing.subtitle,
      };
    case 'ready':
      return {
        title: DASHBOARD_COPY.ready.title,
        subtitle: DASHBOARD_COPY.ready.subtitle,
        ctaLabel: DASHBOARD_COPY.ready.ctaButton,
      };
  }
}
