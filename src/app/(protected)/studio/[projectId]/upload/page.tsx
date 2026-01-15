'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useUploadStore } from '@/features/upload/store/upload-store';
import { useBulkUpload } from '@/features/upload/hooks/useBulkUpload';
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

export default function UploadPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();

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

  // Get current role's upload handler
  const currentUpload = activeRole === 'groom' ? groomUpload : brideUpload;

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
    if (!canProceed) return;

    await updateProject.mutateAsync({
      projectId: params.projectId,
      input: {
        currentStep: 2,
        status: 'optimizing',
      },
    });
    router.push(`/studio/${params.projectId}/optimize`);
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

      <StickyCTA
        onNext={handleNext}
        onBack={handleBack}
        nextLabel="최적화하기"
        backLabel="대시보드"
        isNextDisabled={!canProceed}
        isLoading={updateProject.isPending}
      />
    </>
  );
}
