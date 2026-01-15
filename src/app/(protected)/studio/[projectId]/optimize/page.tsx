'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useSmartMix } from '@/features/optimize/hooks/useSmartMix';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { MosaicGrid } from '@/features/optimize/components/MosaicGrid';
import { ScannerOverlay } from '@/features/optimize/components/ScannerOverlay';
import { CropModeStats } from '@/features/optimize/components/CropModeStats';
import { Card } from '@/components/ui/card';
import { Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

export default function OptimizePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();

  // Smart Mix hook
  const { images, isScanning, scanProgress, toggleCropMode, stats } = useSmartMix({
    autoAssign: true,
  });

  const handleNext = async () => {
    await updateProject.mutateAsync({
      projectId: params.projectId,
      input: {
        currentStep: 3,
        status: 'theme_selecting',
      },
    });
    router.push(`/studio/${params.projectId}/theme`);
  };

  const handleBack = () => {
    router.push(`/studio/${params.projectId}/upload`);
  };

  return (
    <>
      {/* Scanner Overlay */}
      <ScannerOverlay isScanning={isScanning} progress={scanProgress} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl font-bold text-primary-desktop">
            Smart Mix
          </h2>
          <p className="mt-2 text-gray-600">
            AI가 최적의 구도로 사진을 분석했어요
          </p>
        </div>

        {/* Scanner Effect Banner */}
        <Card className="p-6 bg-gradient-to-r from-primary-desktop/5 to-accent-teal/5 border-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-teal/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-accent-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-desktop">
                AI 작가님이 조명과 구도를 체크했어요
              </h3>
              <p className="text-sm text-gray-600">
                얼굴 디테일과 상반신 구조를 최적화했습니다
              </p>
            </div>
          </div>
        </Card>

        {/* Crop Mode Guide */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <ZoomIn className="w-5 h-5 text-primary-desktop" />
              <span className="font-medium">얼굴 포커스 (60%)</span>
            </div>
            <p className="text-sm text-gray-600">
              목과 쇄골 위로 타이트하게 크롭하여
              얼굴 디테일을 학습합니다
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <ZoomOut className="w-5 h-5 text-accent-teal" />
              <span className="font-medium">상반신 구조 (40%)</span>
            </div>
            <p className="text-sm text-gray-600">
              어깨와 가슴선을 포함하여
              신체 구조와 구도를 학습합니다
            </p>
          </Card>
        </div>

        {/* Crop Mode Stats */}
        {stats.total > 0 && (
          <CropModeStats
            total={stats.total}
            faceMode={stats.faceMode}
            bodyMode={stats.bodyMode}
            original={stats.original}
          />
        )}

        {/* Mosaic Grid */}
        <Card className="p-6">
          <h4 className="font-medium text-primary-desktop mb-4">
            최적화된 사진 ({stats.total}장)
          </h4>

          {images.length > 0 ? (
            <>
              <MosaicGrid images={images} onToggleCrop={toggleCropMode} />
              <p className="mt-4 text-sm text-gray-500 text-center">
                사진을 터치하면 얼굴/상반신/원본 모드를 전환할 수 있어요
              </p>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                업로드된 이미지가 없습니다.
              </p>
              <button
                onClick={handleBack}
                className="mt-4 text-primary-desktop hover:underline"
              >
                이미지 업로드하기
              </button>
            </div>
          )}
        </Card>
      </div>

      <StickyCTA
        onNext={handleNext}
        onBack={handleBack}
        nextLabel="테마 선택"
        isLoading={updateProject.isPending}
        isNextDisabled={stats.total === 0}
      />
    </>
  );
}
