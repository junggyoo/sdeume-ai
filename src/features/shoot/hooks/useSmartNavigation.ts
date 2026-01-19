'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useFaceDataStatus } from '@/features/face/hooks/useUserFaceModels';
import { projectKeys } from '@/features/project/hooks/useProject';
import type { Project } from '@/features/project/types';

// =============================================================================
// Types
// =============================================================================

interface CreateProjectInput {
  name?: string;
  reuseExistingFaces?: boolean;
}

interface ProjectResponse {
  ok: true;
  data: Project;
}

// =============================================================================
// API Functions
// =============================================================================

const createProjectWithFaceReuse = async (
  input: CreateProjectInput
): Promise<Project> => {
  const { data } = await apiClient.post<ProjectResponse>('/api/projects', input);
  if (!data.ok) {
    throw new Error('Failed to create project');
  }
  return data.data;
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Smart Navigation hook for new shoot flow
 *
 * - If user has both faces (bride & groom), skip step 1 and go directly to step 2
 * - If user is new or doesn't have both faces, start from step 1
 * - Manages project creation with optional face reuse
 */
export function useSmartNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showUpdateFaceModal, setShowUpdateFaceModal] = useState(false);

  const {
    data: faceStatus,
    isLoading: isFaceStatusLoading,
    hasBothFaces,
    hasAnyFace,
  } = useFaceDataStatus();

  const createProjectMutation = useMutation({
    mutationFn: createProjectWithFaceReuse,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });

  /**
   * Start a new shoot with smart navigation logic
   *
   * - If user has both faces: create project with reuse and go to step 2
   * - Otherwise: go to step 1 (no project created yet)
   */
  const startNewShoot = useCallback(async () => {
    if (hasBothFaces) {
      // User has existing faces - create project with face reuse and skip to step 2
      const project = await createProjectMutation.mutateAsync({
        name: `촬영 ${new Date().toLocaleDateString('ko-KR')}`,
        reuseExistingFaces: true,
      });
      router.push(`/new-shoot/${project.id}/step2`);
    } else {
      // New user or missing faces - start from step 1
      router.push('/new-shoot/step1');
    }
  }, [hasBothFaces, createProjectMutation, router]);

  /**
   * Start new shoot but force going to step 1 (for updating faces)
   */
  const startNewShootWithFaceUpdate = useCallback(() => {
    setShowUpdateFaceModal(false);
    router.push('/new-shoot/step1');
  }, [router]);

  /**
   * Show modal to ask user if they want to update their faces
   * (Called when user has existing faces but wants to update)
   */
  const promptForFaceUpdate = useCallback(() => {
    setShowUpdateFaceModal(true);
  }, []);

  /**
   * Close the update face modal
   */
  const closeUpdateFaceModal = useCallback(() => {
    setShowUpdateFaceModal(false);
  }, []);

  /**
   * Go back from Step 2 with smart navigation
   *
   * - If user has both faces (returning user): go to dashboard
   * - If user is new: go back to step 1
   */
  const goBackFromStep2 = useCallback(() => {
    if (hasBothFaces) {
      // Returning user: they started from dashboard, so go back there
      router.push('/dashboard');
    } else {
      // New user: they came from step 1, so go back there
      router.push('/new-shoot/step1');
    }
  }, [hasBothFaces, router]);

  return {
    // State
    faceStatus,
    hasBothFaces,
    hasAnyFace,
    isLoading: isFaceStatusLoading || createProjectMutation.isPending,
    isCreating: createProjectMutation.isPending,
    showUpdateFaceModal,
    error: createProjectMutation.error,

    // Actions
    startNewShoot,
    startNewShootWithFaceUpdate,
    promptForFaceUpdate,
    closeUpdateFaceModal,
    goBackFromStep2,
  };
}
