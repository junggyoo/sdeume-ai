'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/remote/api-client';
import type { Project, CreateProjectInput } from '../types';
import { projectKeys } from './useProject';

interface ProjectResponse {
  ok: true;
  data: Project;
}

const createProject = async (input: CreateProjectInput): Promise<Project> => {
  const { data } = await apiClient.post<ProjectResponse>('/api/projects', input);
  if (!data.ok) {
    throw new Error('Failed to create project');
  }
  return data.data;
};

export function useCreateProject() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.all });

      // Navigate to the upload step
      router.push(`/studio/${project.id}/upload`);
    },
  });
}
