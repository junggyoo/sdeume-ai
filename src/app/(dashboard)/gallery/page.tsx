'use client';

import {
  GallerySection,
  useDashboardState,
  useCompletedGenerations,
} from '@/features/dashboard';

export default function GalleryPage() {
  const { allProjects, isLoading: isStateLoading } = useDashboardState();
  const { pictorials } = useCompletedGenerations(allProjects);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          갤러리
        </h1>
        <p className="mt-2 text-slate-400">
          완성된 모든 화보를 한눈에 확인하세요
        </p>
      </header>

      <GallerySection pictorials={pictorials} isLoading={isStateLoading} />
    </div>
  );
}
