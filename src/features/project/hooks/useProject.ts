'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { Project } from '../types';

interface ProjectResponse {
  ok: true;
  data: Project;
}

interface ProjectsResponse {
  ok: true;
  data: Project[];
}

const fetchProject = async (projectId: string): Promise<Project> => {
  const { data } = await apiClient.get<ProjectResponse>(
    `/api/projects/${projectId}`
  );
  if (!data.ok) {
    throw new Error('Failed to fetch project');
  }
  return data.data;
};

const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await apiClient.get<ProjectsResponse>('/api/projects');
  if (!data.ok) {
    throw new Error('Failed to fetch projects');
  }
  return data.data;
};

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 30 * 1000,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
    staleTime: 30 * 1000,
  });
}
