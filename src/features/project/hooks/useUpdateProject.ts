'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { Project, UpdateProjectInput } from '../types';
import { projectKeys } from './useProject';

interface ProjectResponse {
  ok: true;
  data: Project;
}

interface UpdateProjectParams {
  projectId: string;
  input: UpdateProjectInput;
}

const updateProject = async ({
  projectId,
  input,
}: UpdateProjectParams): Promise<Project> => {
  const { data } = await apiClient.patch<ProjectResponse>(
    `/api/projects/${projectId}`,
    input
  );
  if (!data.ok) {
    throw new Error('Failed to update project');
  }
  return data.data;
};

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (project) => {
      // Update cache for this specific project
      queryClient.setQueryData(projectKeys.detail(project.id), project);

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
