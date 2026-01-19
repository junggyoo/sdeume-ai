'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  UserFaceModel,
  FaceDataStatus,
  FaceRole,
} from '../types';
import { getFaceDataStatus } from '../types';

// =============================================================================
// Response Types
// =============================================================================

interface FaceModelsResponse {
  ok: true;
  data: UserFaceModel[];
}

interface FaceStatusResponse {
  ok: true;
  data: FaceDataStatus;
}

interface UpsertFaceModelResponse {
  ok: true;
  data: UserFaceModel;
}

// =============================================================================
// API Functions
// =============================================================================

const fetchUserFaceModels = async (): Promise<UserFaceModel[]> => {
  const { data } = await apiClient.get<FaceModelsResponse>(
    '/api/user-face-models'
  );
  if (!data.ok) {
    throw new Error('Failed to fetch face models');
  }
  return data.data;
};

const fetchFaceStatus = async (): Promise<FaceDataStatus> => {
  const { data } = await apiClient.get<FaceStatusResponse>(
    '/api/user-face-models/status'
  );
  if (!data.ok) {
    throw new Error('Failed to fetch face status');
  }
  return data.data;
};

const upsertFaceModel = async (input: {
  role: FaceRole;
  loraModelId: string;
}): Promise<UserFaceModel> => {
  const { data } = await apiClient.post<UpsertFaceModelResponse>(
    '/api/user-face-models',
    input
  );
  if (!data.ok) {
    throw new Error('Failed to upsert face model');
  }
  return data.data;
};

const deactivateFaceModel = async (modelId: string): Promise<void> => {
  const { data } = await apiClient.delete('/api/user-face-models', {
    data: { modelId },
  });
  if (!data.ok) {
    throw new Error('Failed to deactivate face model');
  }
};

// =============================================================================
// Query Keys
// =============================================================================

export const userFaceModelKeys = {
  all: ['user-face-models'] as const,
  status: ['user-face-models', 'status'] as const,
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch all active face models for the current user
 */
export function useUserFaceModels() {
  return useQuery({
    queryKey: userFaceModelKeys.all,
    queryFn: fetchUserFaceModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch face data status (hasBothFaces, hasAnyFace)
 */
export function useFaceDataStatus() {
  const query = useQuery({
    queryKey: userFaceModelKeys.all,
    queryFn: fetchUserFaceModels,
    staleTime: 5 * 60 * 1000,
    select: (data) => getFaceDataStatus(data),
  });

  return {
    ...query,
    data: query.data,
    hasBothFaces: query.data?.hasBothFaces ?? false,
    hasAnyFace: query.data?.hasAnyFace ?? false,
    bride: query.data?.bride ?? null,
    groom: query.data?.groom ?? null,
  };
}

/**
 * Hook to upsert (create or update) a face model
 */
export function useUpsertFaceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertFaceModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userFaceModelKeys.all });
    },
  });
}

/**
 * Hook to deactivate a face model
 */
export function useDeactivateFaceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateFaceModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userFaceModelKeys.all });
    },
  });
}
