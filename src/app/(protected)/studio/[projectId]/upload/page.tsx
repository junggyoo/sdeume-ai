'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useUploadStore } from '@/features/upload/store/upload-store';
import { useBulkUpload } from '@/features/upload/hooks/useBulkUpload';
import { useUploadToStorage } from '@/features/upload/hooks/useUploadToStorage';
import { preloadFaceModels } from '@/features/upload/lib/face-mesh';
import { MIN_PHOTOS_PER_ROLE, RECOMMENDED_PHOTOS_PER_ROLE } from '@/features/upload/types';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { UploadProgress } from '@/features/upload/components/UploadProgress';
import { PersonTab } from '@/features/upload/components/PersonTab';
import { UploadZone } from '@/features/upload/components/UploadZone';
import { PhotoGrid } from '@/features/upload/components/PhotoGrid';
import { ProgressIndicator } from '@/features/upload/components/ProgressIndicator';
import { OverallProgress } from '@/features/upload/components/OverallProgress';
import { TipBanner } from '@/features/upload/components/TipBanner';
import { GuidelineCard } from '@/features/upload/components/GuidelineCard';

export default function UploadPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();

  // Preload face detection models on page mount
  useEffect(() => {
    preloadFaceModels().catch(console.error);
  }, []);

  // Upload store
  const { activeRole, setActiveRole, getBucketSummary } = useUploadStore();

  // Bulk upload hooks for each role
  const groomUpload = useBulkUpload({
    projectId: params.projectId,
    role: 'groom',
  });

  const brideUpload = useBulkUpload({
    projectId: params.projectId,
    role: 'bride',
  });

  // Storage upload hooks for each role
  const groomStorage = useUploadToStorage({
    projectId: params.projectId,
  });

  const brideStorage = useUploadToStorage({
    projectId: params.projectId,
  });

  // Upload error state
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Get current role's upload handler
  const currentUpload = activeRole === 'groom' ? groomUpload : brideUpload;

  // Combined syncing state
  const isSyncing = groomStorage.isSyncing || brideStorage.isSyncing;
  const syncProgress = groomStorage.syncProgress + brideStorage.syncProgress;
  const syncTotal = groomStorage.syncTotal + brideStorage.syncTotal;

  // Calculate total for both roles
  const groomSummary = getBucketSummary('groom');
  const brideSummary = getBucketSummary('bride');
  const groomCount = groomSummary.total;
  const brideCount = brideSummary.total;

  // Check if both roles have minimum uploads
  const groomHasMinimum = groomCount >= MIN_PHOTOS_PER_ROLE;
  const brideHasMinimum = brideCount >= MIN_PHOTOS_PER_ROLE;
  const groomComplete = groomCount >= RECOMMENDED_PHOTOS_PER_ROLE;
  const brideComplete = brideCount >= RECOMMENDED_PHOTOS_PER_ROLE;

  // Can proceed only if both roles have minimum
  const canProceed = groomHasMinimum && brideHasMinimum;

  const handleNext = async () => {
    if (!canProceed || isSyncing) return;

    setUploadError(null);

    try {
      // Upload all images to Supabase Storage in parallel
      const [groomUploads, brideUploads] = await Promise.all([
        groomStorage.syncUploadsToServer('groom'),
        brideStorage.syncUploadsToServer('bride'),
      ]);

      // Check if uploads were successful
      if (groomUploads.length === 0 && brideUploads.length === 0) {
        setUploadError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // Update project and navigate to next step
      await updateProject.mutateAsync({
        projectId: params.projectId,
        input: {
          currentStep: 2,
          status: 'theme_selecting',
        },
      });
      router.push(`/studio/${params.projectId}/theme`);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.'
      );
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Main Content */}
      <div className="pb-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto py-6 space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">STEP 1 OF 5</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              얼굴 사진 등록
            </h1>
          </div>

          {/* Tip Banner + Guideline Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TipBanner
              title="팁"
              tip="각 역할당 20장의 다양한 얼굴 사진을 올리면 최상의 결과를 얻을 수 있어요!"
            />
            <GuidelineCard />
          </div>

          {/* Desktop Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Column - Upload Area */}
            <div className="md:col-span-3 space-y-4">
              {/* Person Tab */}
              <PersonTab
                activeRole={activeRole}
                onRoleChange={setActiveRole}
                groomCount={groomCount}
                brideCount={brideCount}
                groomComplete={groomComplete}
                brideComplete={brideComplete}
              />

              {/* Upload Zone */}
              <UploadZone
                onFilesSelect={(files) => currentUpload.addFiles(files)}
                photoCount={activeRole === 'groom' ? groomCount : brideCount}
                maxPhotos={RECOMMENDED_PHOTOS_PER_ROLE}
                role={activeRole}
                isProcessing={currentUpload.isProcessing}
                processingCount={currentUpload.processingCount}
              />

              {/* Photo Grid */}
              <PhotoGrid
                items={currentUpload.queue}
                onRemove={currentUpload.removeFile}
                onAddMore={(files) => currentUpload.addFiles(files)}
                role={activeRole}
                maxPhotos={RECOMMENDED_PHOTOS_PER_ROLE}
                columns={4}
              />
            </div>

            {/* Right Column - Progress */}
            <div className="md:col-span-2 space-y-4">
              {/* Current Role Progress */}
              <ProgressIndicator
                current={activeRole === 'groom' ? groomCount : brideCount}
              />

              {/* Overall Progress */}
              <OverallProgress
                groomCount={groomCount}
                brideCount={brideCount}
              />

              {/* Completion Tip */}
              {canProceed && (
                <TipBanner
                  variant="success"
                  title="준비 완료!"
                  tip="최소 요구사항을 충족했어요. 더 좋은 결과를 위해 사진을 추가하거나, 바로 다음 단계로 넘어가세요."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      {isSyncing && (
        <UploadProgress
          progress={syncProgress}
          total={syncTotal}
          variant="dark"
        />
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            {uploadError}
          </div>
        </div>
      )}

      <StickyCTA
        onNext={handleNext}
        onBack={handleBack}
        nextLabel={isSyncing ? '업로드 중...' : '테마 선택하기'}
        backLabel="대시보드"
        isNextDisabled={!canProceed || isSyncing}
        isLoading={updateProject.isPending || isSyncing}
        variant="dark"
        progress={{
          brideCount,
          groomCount,
          maxPhotos: RECOMMENDED_PHOTOS_PER_ROLE,
        }}
      />
    </div>
  );
}
