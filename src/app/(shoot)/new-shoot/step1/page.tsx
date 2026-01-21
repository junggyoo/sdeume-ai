'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useUploadStore } from '@/features/upload/store/upload-store';
import { useBulkUpload } from '@/features/upload/hooks/useBulkUpload';
import { useUploadToStorage } from '@/features/upload/hooks/useUploadToStorage';
import { useFaceDataStatus } from '@/features/face/hooks/useUserFaceModels';
import { preloadFaceModels } from '@/features/upload/lib/face-mesh';
import { RECOMMENDED_PHOTOS_PER_ROLE } from '@/features/upload/types';
import { UploadProgress } from '@/features/upload/components/UploadProgress';
import { projectKeys } from '@/features/project/hooks/useProject';
import type { Project } from '@/features/project/types';
import {
  AtelierUploadHeader,
  AtelierDropzone,
  AtelierPhotoGrid,
  CircularProgressWidget,
  QuickGuideWidget,
} from '@/features/upload-v2';

interface ProjectResponse {
  ok: true;
  data: Project;
}

export default function Step1Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasBothFaces } = useFaceDataStatus();

  // Preload face detection models on page mount
  useEffect(() => {
    preloadFaceModels().catch(console.error);
  }, []);

  // Upload store (no projectId initially)
  const { activeRole, setActiveRole, getBucketSummary } = useUploadStore();

  // Temporary project ID for uploads (will be created on next)
  const [tempProjectId] = useState(() => crypto.randomUUID());

  // Bulk upload hooks for each role
  const groomUpload = useBulkUpload({
    projectId: tempProjectId,
    role: 'groom',
  });

  const brideUpload = useBulkUpload({
    projectId: tempProjectId,
    role: 'bride',
  });

  // Storage upload hooks for each role
  const groomStorage = useUploadToStorage({
    projectId: tempProjectId,
  });

  const brideStorage = useUploadToStorage({
    projectId: tempProjectId,
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

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ProjectResponse>('/api/projects', {
        name: `촬영 ${new Date().toLocaleDateString('ko-KR')}`,
      });
      if (!data.ok) {
        throw new Error('Failed to create project');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });

  const handleNext = async () => {
    if (isSyncing) return;

    setUploadError(null);

    try {
      // 1. Create project first
      const project = await createProjectMutation.mutateAsync();

      // 2. Upload all images to Supabase Storage in parallel
      // Note: Images will be uploaded with the real project ID (override the temp one)
      const [groomUploads, brideUploads] = await Promise.all([
        groomStorage.syncUploadsToServer('groom', { projectIdOverride: project.id }),
        brideStorage.syncUploadsToServer('bride', { projectIdOverride: project.id }),
      ]);

      // Check if uploads were successful
      if (groomUploads.length === 0 && brideUploads.length === 0) {
        setUploadError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 3. Navigate to step 2
      router.push(`/new-shoot/${project.id}/step2`);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : '업로드 중 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Upload Area (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header with Role Switcher */}
            <AtelierUploadHeader
              activeRole={activeRole}
              onRoleChange={setActiveRole}
              groomCount={groomCount}
              brideCount={brideCount}
              hasBothFaces={hasBothFaces}
            />

            {/* Dropzone */}
            <AtelierDropzone
              onFilesSelect={(files) => currentUpload.addFiles(files)}
              isProcessing={currentUpload.isProcessing}
              processingCount={currentUpload.processingCount}
            />

            {/* Photo Grid */}
            <AtelierPhotoGrid
              items={currentUpload.queue}
              onRemove={currentUpload.removeFile}
              onAddMore={(files) => currentUpload.addFiles(files)}
              maxPhotos={RECOMMENDED_PHOTOS_PER_ROLE}
            />
          </div>

          {/* Right Column - Progress & Guide (4 cols on desktop) */}
          <div className="lg:col-span-4 pt-0 lg:pt-12">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Circular Progress Widget */}
              <CircularProgressWidget
                groomCount={groomCount}
                brideCount={brideCount}
                onNext={handleNext}
                isLoading={createProjectMutation.isPending}
                isSyncing={isSyncing}
              />

              {/* Quick Guide Widget */}
              <QuickGuideWidget />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      {isSyncing && (
        <UploadProgress
          progress={syncProgress}
          total={syncTotal}
          variant="light"
        />
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/90 text-white px-6 py-3 rounded-2xl shadow-lg backdrop-blur-sm">
            {uploadError}
          </div>
        </div>
      )}
    </div>
  );
}
