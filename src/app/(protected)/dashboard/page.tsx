'use client';

import { useRouter } from 'next/navigation';
import { useCreateProject } from '@/features/project/hooks/useCreateProject';
import {
  DashboardLayout,
  DashboardSidebar,
  HeroSection,
  GallerySection,
  useDashboardState,
  useCompletedGenerations,
  DASHBOARD_COPY,
} from '@/features/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  const { state, processingProject, allProjects, isLoading: isStateLoading } =
    useDashboardState();

  // Fetch generations for ALL projects to find completed pictorials
  // This ensures we show pictorials even if project status has changed
  const { pictorials, isLoading: isPictorialsLoading } =
    useCompletedGenerations(allProjects);

  // Calculate gallery count from pictorials
  const galleryCount = pictorials.reduce((sum, p) => sum + p.images.length, 0);

  // Check if user has face model (has completed pictorials or is processing)
  const hasFaceModel = pictorials.length > 0 || state === 'processing' || state === 'ready';

  const handleCreateProject = () => {
    createProject.mutate(
      { name: '새 프로젝트' },
      {
        onSuccess: (project) => {
          router.push(`/studio/${project.id}`);
        },
      }
    );
  };

  // Show loading state
  if (isStateLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-6 w-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          galleryCount={galleryCount}
          hasFaceModel={hasFaceModel}
          planType="free"
          remainingCount={24}
          totalCount={30}
        />
      }
    >
      <div className="space-y-8">
        {/* Page Header */}
        <header>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-desktop">
            {DASHBOARD_COPY.pageTitle}
          </h1>
        </header>

        {/* Hero Section - State-aware */}
        <HeroSection
          state={state}
          processingProject={processingProject}
          onCreateProject={handleCreateProject}
          isCreatingProject={createProject.isPending}
        />

        {/* Gallery Section */}
        <GallerySection
          pictorials={pictorials}
          isLoading={isPictorialsLoading}
        />
      </div>
    </DashboardLayout>
  );
}
