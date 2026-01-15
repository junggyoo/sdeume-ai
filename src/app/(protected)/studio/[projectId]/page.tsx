'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { getStepById } from '@/features/studio/types';
import { Loader2 } from 'lucide-react';

export default function StudioIndexPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading } = useProject(params.projectId);

  useEffect(() => {
    if (project) {
      const step = getStepById(project.currentStep);
      if (step) {
        router.replace(`/studio/${params.projectId}/${step.path}`);
      }
    }
  }, [project, params.projectId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-desktop" />
      </div>
    );
  }

  return null;
}
