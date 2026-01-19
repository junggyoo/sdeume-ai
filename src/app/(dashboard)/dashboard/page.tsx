'use client';

import { useRouter } from 'next/navigation';
import { useSmartNavigation } from '@/features/shoot/hooks/useSmartNavigation';
import {
  HeroSection,
  GallerySection,
  useDashboardState,
  useCompletedGenerations,
  DASHBOARD_COPY,
} from '@/features/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { startNewShoot, isCreating } = useSmartNavigation();

  const {
    state,
    processingProject,
    allProjects,
    isLoading: isStateLoading,
  } = useDashboardState();

  const { pictorials } = useCompletedGenerations(allProjects);

  const handleCreateProject = async () => {
    await startNewShoot();
  };

  if (isStateLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-40 rounded-xl bg-slate-700" />
        <div className="space-y-4">
          <Skeleton variant="text" className="h-6 w-24 bg-slate-700" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          {DASHBOARD_COPY.pageTitle}
        </h1>
      </header>

      <HeroSection
        state={state}
        processingProject={processingProject}
        onCreateProject={handleCreateProject}
        isCreatingProject={isCreating}
      />

      <GallerySection pictorials={pictorials} isLoading={isStateLoading} />
    </div>
  );
}
