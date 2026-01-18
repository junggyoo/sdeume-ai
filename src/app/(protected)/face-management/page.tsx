'use client';

import {
  DashboardLayout,
  DashboardSidebar,
  useDashboardState,
  useCompletedGenerations,
} from '@/features/dashboard';
import { Card } from '@/components/ui/card';
import User from 'lucide-react/dist/esm/icons/user';

export default function FaceManagementPage() {
  const { allProjects } = useDashboardState();
  const { pictorials } = useCompletedGenerations(allProjects);

  const galleryCount = pictorials.reduce((sum, p) => sum + p.images.length, 0);
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
            내 얼굴 관리
          </h1>
          <p className="mt-2 text-muted-foreground">
            등록된 얼굴 모델을 관리하세요
          </p>
        </header>

        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-primary-desktop mb-2">
              얼굴 모델 관리
            </h2>
            <p className="text-muted-foreground max-w-md">
              이 기능은 준비 중입니다. 곧 등록된 얼굴 모델을 확인하고 관리할 수 있습니다.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
