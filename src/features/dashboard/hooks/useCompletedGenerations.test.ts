import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCompletedGenerations } from './useCompletedGenerations';
import type { Project } from '@/features/project/types';
import type { Generation } from '@/features/generation/types';

// Mock the API client
vi.mock('@/lib/remote/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/remote/api-client';

const mockApiClient = vi.mocked(apiClient);

// Helper to create mock projects
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Test Project',
  status: 'completed',
  currentStep: 4,
  selectedThemeId: 'theme-1',
  planId: null,
  groomUploadCount: 5,
  brideUploadCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock generations
const createMockGeneration = (overrides: Partial<Generation> = {}): Generation => ({
  id: 'gen-1',
  projectId: 'project-1',
  userId: 'user-1',
  modalJobId: 'job-1',
  themeId: 'theme-1',
  prompt: null,
  parameters: {},
  status: 'completed',
  images: [
    { url: 'https://example.com/image1.jpg', is_blur: false },
    { url: 'https://example.com/image2.jpg', is_blur: false },
  ],
  startedAt: '2024-01-01T00:00:00Z',
  completedAt: '2024-01-01T01:00:00Z',
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00Z',
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

describe('useCompletedGenerations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should return isLoading true when fetching generations', async () => {
      const projects = [createMockProject()];
      mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should return empty pictorials while loading', async () => {
      const projects = [createMockProject()];
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      expect(result.current.pictorials).toEqual([]);
    });
  });

  describe('with empty projects', () => {
    it('should return empty pictorials when no projects provided', async () => {
      const { result } = renderHook(() => useCompletedGenerations([]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials).toEqual([]);
    });

    it('should not make API calls when projects array is empty', async () => {
      renderHook(() => useCompletedGenerations([]), {
        wrapper: createWrapper(),
      });

      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('fetching generations', () => {
    it('should fetch generations for each completed project', async () => {
      const projects = [
        createMockProject({ id: 'project-1' }),
        createMockProject({ id: 'project-2' }),
      ];
      const generation1 = createMockGeneration({ id: 'gen-1', projectId: 'project-1' });
      const generation2 = createMockGeneration({ id: 'gen-2', projectId: 'project-2' });

      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('project-1')) {
          return Promise.resolve({ data: { ok: true, data: generation1 } });
        }
        if (url.includes('project-2')) {
          return Promise.resolve({ data: { ok: true, data: generation2 } });
        }
        return Promise.reject(new Error('Not found'));
      });

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials).toHaveLength(2);
    });

    it('should transform generations into pictorials format', async () => {
      const project = createMockProject({
        id: 'project-1',
        name: 'My Wedding',
      });
      const generation = createMockGeneration({
        id: 'gen-1',
        projectId: 'project-1',
        themeId: 'theme-romantic',
        completedAt: '2024-01-15T12:00:00Z',
        images: [
          { url: 'https://example.com/image1.jpg', is_blur: false },
          { url: 'https://example.com/image2.jpg', is_blur: false },
        ],
      });

      mockApiClient.get.mockResolvedValue({
        data: { ok: true, data: generation },
      });

      const { result } = renderHook(() => useCompletedGenerations([project]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const pictorial = result.current.pictorials[0];
      expect(pictorial.id).toBe('gen-1');
      expect(pictorial.projectId).toBe('project-1');
      expect(pictorial.projectName).toBe('My Wedding');
      expect(pictorial.images).toHaveLength(2);
      expect(pictorial.completedAt).toBe('2024-01-15T12:00:00Z');
      // Theme fields can be null initially (fetched separately or not available)
      expect(pictorial).toHaveProperty('themeName');
      expect(pictorial).toHaveProperty('themeDisplayNameKo');
    });

    it('should handle project with null name', async () => {
      const project = createMockProject({
        id: 'project-1',
        name: null,
      });
      const generation = createMockGeneration({
        id: 'gen-1',
        projectId: 'project-1',
      });

      mockApiClient.get.mockResolvedValue({
        data: { ok: true, data: generation },
      });

      const { result } = renderHook(() => useCompletedGenerations([project]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials[0].projectName).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const project = createMockProject();
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCompletedGenerations([project]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials).toEqual([]);
    });

    it('should handle 404 response (no generation for project)', async () => {
      const project = createMockProject();
      mockApiClient.get.mockResolvedValue({
        data: { ok: false },
      });

      const { result } = renderHook(() => useCompletedGenerations([project]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials).toEqual([]);
    });
  });

  describe('filtering and sorting', () => {
    it('should only include pictorials with completed generations', async () => {
      const projects = [
        createMockProject({ id: 'project-1' }),
        createMockProject({ id: 'project-2' }),
      ];
      const completedGen = createMockGeneration({
        id: 'gen-1',
        projectId: 'project-1',
        status: 'completed',
      });
      const pendingGen = createMockGeneration({
        id: 'gen-2',
        projectId: 'project-2',
        status: 'generating',
      });

      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('project-1')) {
          return Promise.resolve({ data: { ok: true, data: completedGen } });
        }
        if (url.includes('project-2')) {
          return Promise.resolve({ data: { ok: true, data: pendingGen } });
        }
        return Promise.reject(new Error('Not found'));
      });

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Only completed generation should be included
      expect(result.current.pictorials).toHaveLength(1);
      expect(result.current.pictorials[0].id).toBe('gen-1');
    });

    it('should sort pictorials by completedAt date (newest first)', async () => {
      const projects = [
        createMockProject({ id: 'project-1' }),
        createMockProject({ id: 'project-2' }),
      ];
      const olderGen = createMockGeneration({
        id: 'gen-old',
        projectId: 'project-1',
        completedAt: '2024-01-01T00:00:00Z',
      });
      const newerGen = createMockGeneration({
        id: 'gen-new',
        projectId: 'project-2',
        completedAt: '2024-01-15T00:00:00Z',
      });

      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('project-1')) {
          return Promise.resolve({ data: { ok: true, data: olderGen } });
        }
        if (url.includes('project-2')) {
          return Promise.resolve({ data: { ok: true, data: newerGen } });
        }
        return Promise.reject(new Error('Not found'));
      });

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials[0].id).toBe('gen-new');
      expect(result.current.pictorials[1].id).toBe('gen-old');
    });
  });

  describe('pictorial data structure', () => {
    it('should include all required pictorial fields', async () => {
      const project = createMockProject({
        id: 'project-1',
        name: 'Wedding Day',
      });
      const generation = createMockGeneration({
        id: 'gen-1',
        projectId: 'project-1',
        themeId: 'theme-romantic',
        completedAt: '2024-01-15T12:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        images: [{ url: 'https://example.com/img.jpg', is_blur: false }],
      });

      mockApiClient.get.mockResolvedValue({
        data: { ok: true, data: generation },
      });

      const { result } = renderHook(() => useCompletedGenerations([project]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const pictorial = result.current.pictorials[0];
      expect(pictorial).toHaveProperty('id');
      expect(pictorial).toHaveProperty('projectId');
      expect(pictorial).toHaveProperty('projectName');
      expect(pictorial).toHaveProperty('themeName');
      expect(pictorial).toHaveProperty('themeDisplayNameKo');
      expect(pictorial).toHaveProperty('images');
      expect(pictorial).toHaveProperty('completedAt');
      expect(pictorial).toHaveProperty('createdAt');
    });
  });

  describe('partial success', () => {
    it('should return successful results even when some API calls fail', async () => {
      const projects = [
        createMockProject({ id: 'project-1' }),
        createMockProject({ id: 'project-2' }),
      ];
      const successGen = createMockGeneration({
        id: 'gen-success',
        projectId: 'project-1',
      });

      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('project-1')) {
          return Promise.resolve({ data: { ok: true, data: successGen } });
        }
        return Promise.reject(new Error('API Error'));
      });

      const { result } = renderHook(() => useCompletedGenerations(projects), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pictorials).toHaveLength(1);
      expect(result.current.pictorials[0].id).toBe('gen-success');
    });
  });
});
