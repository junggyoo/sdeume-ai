import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { determineDashboardState, useDashboardState } from './useDashboardState';
import type { Project } from '@/features/project/types';

// Mock useProjects hook
vi.mock('@/features/project/hooks/useProject', () => ({
  useProjects: vi.fn(),
}));

import { useProjects } from '@/features/project/hooks/useProject';

const mockUseProjects = vi.mocked(useProjects);

// Helper to create mock projects
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Test Project',
  status: 'draft',
  currentStep: 1,
  selectedThemeId: null,
  planId: null,
  groomUploadCount: 0,
  brideUploadCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Wrapper for react-query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('determineDashboardState', () => {
  describe('new_user state', () => {
    it('should return new_user when projects array is empty', () => {
      const result = determineDashboardState([]);
      expect(result.state).toBe('new_user');
    });

    it('should return new_user when projects is undefined', () => {
      const result = determineDashboardState(undefined);
      expect(result.state).toBe('new_user');
    });

    it('should return new_user when no project has face uploads', () => {
      const projects: Project[] = [
        createMockProject({ groomUploadCount: 0, brideUploadCount: 0 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('new_user');
    });

    it('should return new_user when only draft projects exist without uploads', () => {
      const projects: Project[] = [
        createMockProject({ status: 'draft', groomUploadCount: 0, brideUploadCount: 0 }),
        createMockProject({ id: 'project-2', status: 'draft', groomUploadCount: 0, brideUploadCount: 0 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('new_user');
    });

    it('should have null processingProject for new_user state', () => {
      const result = determineDashboardState([]);
      expect(result.processingProject).toBeNull();
    });

    it('should have empty completedProjects for new_user state', () => {
      const result = determineDashboardState([]);
      expect(result.completedProjects).toEqual([]);
    });

    it('should have empty allProjects when projects array is empty', () => {
      const result = determineDashboardState([]);
      expect(result.allProjects).toEqual([]);
    });

    it('should return all projects in allProjects even for new_user state', () => {
      const projects: Project[] = [
        createMockProject({ status: 'draft', groomUploadCount: 0, brideUploadCount: 0 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.allProjects).toEqual(projects);
    });
  });

  describe('processing state', () => {
    it('should return processing when a project has training status', () => {
      const projects: Project[] = [
        createMockProject({ status: 'training', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('processing');
    });

    it('should return processing when a project has generating status', () => {
      const projects: Project[] = [
        createMockProject({ status: 'generating', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('processing');
    });

    it('should return the processing project in processingProject', () => {
      const processingProject = createMockProject({
        id: 'processing-project',
        status: 'training',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });
      const projects: Project[] = [processingProject];
      const result = determineDashboardState(projects);
      expect(result.processingProject).toEqual(processingProject);
    });

    it('should prioritize processing state over ready state', () => {
      const projects: Project[] = [
        createMockProject({ id: 'completed-project', status: 'completed', groomUploadCount: 5, brideUploadCount: 5 }),
        createMockProject({ id: 'training-project', status: 'training', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('processing');
    });

    it('should return first processing project when multiple exist', () => {
      const firstProcessing = createMockProject({
        id: 'first-processing',
        status: 'training',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });
      const secondProcessing = createMockProject({
        id: 'second-processing',
        status: 'generating',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });
      const projects: Project[] = [firstProcessing, secondProcessing];
      const result = determineDashboardState(projects);
      expect(result.processingProject?.id).toBe('first-processing');
    });

    it('should return all projects in allProjects for processing state', () => {
      const projects: Project[] = [
        createMockProject({ id: 'completed', status: 'completed', groomUploadCount: 5, brideUploadCount: 5 }),
        createMockProject({ id: 'training', status: 'training', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.allProjects).toEqual(projects);
      expect(result.allProjects).toHaveLength(2);
    });
  });

  describe('ready state', () => {
    it('should return ready when a project has completed status', () => {
      const projects: Project[] = [
        createMockProject({ status: 'completed', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('ready');
    });

    it('should return all completed projects in completedProjects', () => {
      const completedProject1 = createMockProject({
        id: 'completed-1',
        status: 'completed',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });
      const completedProject2 = createMockProject({
        id: 'completed-2',
        status: 'completed',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });
      const projects: Project[] = [completedProject1, completedProject2];
      const result = determineDashboardState(projects);
      expect(result.completedProjects).toHaveLength(2);
      expect(result.completedProjects).toContainEqual(completedProject1);
      expect(result.completedProjects).toContainEqual(completedProject2);
    });

    it('should have null processingProject for ready state', () => {
      const projects: Project[] = [
        createMockProject({ status: 'completed', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.processingProject).toBeNull();
    });

    it('should exclude non-completed projects from completedProjects', () => {
      const projects: Project[] = [
        createMockProject({ id: 'completed', status: 'completed', groomUploadCount: 5, brideUploadCount: 5 }),
        createMockProject({ id: 'draft', status: 'draft', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.completedProjects).toHaveLength(1);
      expect(result.completedProjects[0].id).toBe('completed');
    });
  });

  describe('edge cases', () => {
    it('should treat failed projects as not completed', () => {
      const projects: Project[] = [
        createMockProject({ status: 'failed', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('new_user');
      expect(result.completedProjects).toEqual([]);
    });

    it('should return new_user when only uploading or theme_selecting status exists', () => {
      const projects: Project[] = [
        createMockProject({ status: 'uploading', groomUploadCount: 0, brideUploadCount: 0 }),
        createMockProject({ id: 'p2', status: 'theme_selecting', groomUploadCount: 5, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('new_user');
    });

    it('should handle project with only groom uploads', () => {
      const projects: Project[] = [
        createMockProject({ status: 'completed', groomUploadCount: 5, brideUploadCount: 0 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('ready');
    });

    it('should handle project with only bride uploads', () => {
      const projects: Project[] = [
        createMockProject({ status: 'completed', groomUploadCount: 0, brideUploadCount: 5 }),
      ];
      const result = determineDashboardState(projects);
      expect(result.state).toBe('ready');
    });
  });
});

describe('useDashboardState hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should return isLoading true when projects are loading', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useProjects>);

      const { result } = renderHook(() => useDashboardState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return default state while loading', () => {
      mockUseProjects.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useProjects>);

      const { result } = renderHook(() => useDashboardState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state).toBe('new_user');
      expect(result.current.processingProject).toBeNull();
      expect(result.current.completedProjects).toEqual([]);
    });
  });

  describe('with projects data', () => {
    it('should return new_user state when no projects', async () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProjects>);

      const { result } = renderHook(() => useDashboardState(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.state).toBe('new_user');
    });

    it('should return processing state when project is training', async () => {
      const trainingProject = createMockProject({
        status: 'training',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });

      mockUseProjects.mockReturnValue({
        data: [trainingProject],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProjects>);

      const { result } = renderHook(() => useDashboardState(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.state).toBe('processing');
      expect(result.current.processingProject).toEqual(trainingProject);
    });

    it('should return ready state when project is completed', async () => {
      const completedProject = createMockProject({
        status: 'completed',
        groomUploadCount: 5,
        brideUploadCount: 5,
      });

      mockUseProjects.mockReturnValue({
        data: [completedProject],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useProjects>);

      const { result } = renderHook(() => useDashboardState(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.state).toBe('ready');
      expect(result.current.completedProjects).toEqual([completedProject]);
    });
  });
});
