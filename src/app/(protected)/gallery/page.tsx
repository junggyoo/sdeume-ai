'use client';

import { useRouter } from 'next/navigation';
import {
  DashboardLayout,
  DashboardSidebar,
  GallerySection,
  useDashboardState,
  useCompletedGenerations,
} from '@/features/dashboard';

export default function GalleryPage() {
  const router = useRouter();
  const { allProjects, isLoading: isStateLoading } = useDashboardState();
  const { pictorials, isLoading: isPictorialsLoading } =
    useCompletedGenerations(allProjects);

  // Calculate gallery count from pictorials
  const galleryCount = pictorials.reduce((sum, p) => sum + p.images.length, 0);

  // Check if user has face model
  const hasFaceModel = pictorials.length > 0 || allProjects.length > 0;

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
        <header>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-desktop">
            갤러리
          </h1>
          <p className="mt-2 text-muted-foreground">
            완성된 모든 화보를 한눈에 확인하세요
          </p>
        </header>

        <GallerySection
          pictorials={pictorials}
          isLoading={isStateLoading || isPictorialsLoading}
        />
      </div>
    </DashboardLayout>
  );
}
