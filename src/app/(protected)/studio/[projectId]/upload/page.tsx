'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useUploadStore } from '@/features/upload/store/upload-store';
import { useBulkUpload } from '@/features/upload/hooks/useBulkUpload';
import { useUploadToStorage } from '@/features/upload/hooks/useUploadToStorage';
import { preloadFaceModels } from '@/features/upload/lib/face-mesh';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { RoleTabs } from '@/features/upload/components/RoleTabs';
import { OXGuide } from '@/features/upload/components/OXGuide';
import { BulkUploader } from '@/features/upload/components/BulkUploader';
import { BucketBoard } from '@/features/upload/components/BucketBoard';
import {
  GapFillingPrompt,
  MIN_PHOTOS_PER_ROLE,
  MIN_TOTAL_PHOTOS,
} from '@/features/upload/components/GapFillingPrompt';
import { UploadProgress } from '@/features/upload/components/UploadProgress';

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
  const totalUploads = groomSummary.total + brideSummary.total;

  // Check if both roles have minimum uploads
  const groomHasMinimum = groomSummary.total >= MIN_PHOTOS_PER_ROLE;
  const brideHasMinimum = brideSummary.total >= MIN_PHOTOS_PER_ROLE;
  const hasMinimumTotal = totalUploads >= MIN_TOTAL_PHOTOS;

  // Can proceed only if both roles have minimum AND total meets threshold
  const canProceed = groomHasMinimum && brideHasMinimum && hasMinimumTotal;

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
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl font-bold text-primary-desktop">
            사진 업로드
          </h2>
          <p className="mt-2 text-gray-600">
            AI가 두 분의 얼굴을 학습할 사진을 업로드해주세요
          </p>
        </div>

        {/* OX Guide */}
        <OXGuide />

        {/* Role Tabs */}
        <RoleTabs
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          groomSummary={groomSummary}
          brideSummary={brideSummary}
        />

        {/* Bulk Uploader */}
        <BulkUploader
          onFilesSelect={(files) => currentUpload.addFiles(files)}
          queue={currentUpload.queue}
          onRemove={currentUpload.removeFile}
          isProcessing={currentUpload.isProcessing}
          processingCount={currentUpload.processingCount}
        />

        {/* Bucket Summary */}
        <BucketBoard summary={currentUpload.bucketSummary} />

        {/* Gap Filling Prompt */}
        <GapFillingPrompt
          totalCount={totalUploads}
          groomCount={groomSummary.total}
          brideCount={brideSummary.total}
          needsMoreFrontal={
            groomUpload.needsMoreFrontal || brideUpload.needsMoreFrontal
          }
          needsMoreSide={groomUpload.needsMoreSide || brideUpload.needsMoreSide}
          gapFillingMessage={
            currentUpload.gapFillingMessage ||
            (activeRole === 'groom'
              ? brideUpload.gapFillingMessage
              : groomUpload.gapFillingMessage)
          }
        />
      </div>

      {/* Upload Progress Overlay */}
      {isSyncing && (
        <UploadProgress
          progress={syncProgress}
          total={syncTotal}
        />
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
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
      />
    </>
  );
}
