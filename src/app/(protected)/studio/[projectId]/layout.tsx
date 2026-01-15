'use client';

import { useParams } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { StudioStepper } from '@/features/studio/components/StudioStepper';
import { Loader2 } from 'lucide-react';

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const params = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProject(params.projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-desktop" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            프로젝트를 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-gray-600">
            존재하지 않거나 접근 권한이 없는 프로젝트입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header with Stepper */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1040px] mx-auto px-4 py-4 md:px-6">
          {/* Project Name */}
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-serif text-lg font-bold text-primary-desktop">
              {project.name || '새 프로젝트'}
            </h1>
          </div>

          {/* Stepper */}
          <StudioStepper currentStep={project.currentStep} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1040px] mx-auto px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
