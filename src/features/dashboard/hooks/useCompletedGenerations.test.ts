import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCompletedGenerations } from './useCompletedGenerations';
import type { Project, LatestGeneration } from '@/features/project/types';

// Helper to create mock latest generation
const createMockLatestGeneration = (
  overrides: Partial<LatestGeneration> = {}
): LatestGeneration => ({
  id: 'gen-1',
  status: 'completed',
  images: [
    { url: 'https://example.com/image1.jpg', is_blur: false },
    { url: 'https://example.com/image2.jpg', is_blur: false },
  ],
  completedAt: '2024-01-01T01:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

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
  latestGeneration: null,
  ...overrides,
});

describe('useCompletedGenerations', () => {
  describe('with empty projects', () => {
    it('should return empty pictorials when no projects provided', () => {
      const { result } = renderHook(() => useCompletedGenerations([]));
      expect(result.current.pictorials).toEqual([]);
    });
  });

  describe('filtering completed generations', () => {
    it('should return pictorials for projects with completed generations', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          latestGeneration: createMockLatestGeneration({ id: 'gen-1' }),
        }),
        createMockProject({
          id: 'project-2',
          latestGeneration: createMockLatestGeneration({ id: 'gen-2' }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials).toHaveLength(2);
    });

    it('should exclude projects without latestGeneration', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          latestGeneration: createMockLatestGeneration({ id: 'gen-1' }),
        }),
        createMockProject({
          id: 'project-2',
          latestGeneration: null,
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials).toHaveLength(1);
      expect(result.current.pictorials[0].id).toBe('gen-1');
    });

    it('should exclude projects with non-completed generation status', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-completed',
            status: 'completed',
          }),
        }),
        createMockProject({
          id: 'project-2',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-generating',
            status: 'generating',
          }),
        }),
        createMockProject({
          id: 'project-3',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-failed',
            status: 'failed',
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials).toHaveLength(1);
      expect(result.current.pictorials[0].id).toBe('gen-completed');
    });

    it('should exclude completed generations with no images', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-with-images',
            images: [{ url: 'https://example.com/image.jpg', is_blur: false }],
          }),
        }),
        createMockProject({
          id: 'project-2',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-no-images',
            images: [],
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials).toHaveLength(1);
      expect(result.current.pictorials[0].id).toBe('gen-with-images');
    });
  });

  describe('transformation to Pictorial', () => {
    it('should transform latestGeneration into pictorial format', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          name: 'My Wedding',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-1',
            completedAt: '2024-01-15T12:00:00Z',
            createdAt: '2024-01-15T10:00:00Z',
            images: [
              { url: 'https://example.com/image1.jpg', is_blur: false },
              { url: 'https://example.com/image2.jpg', is_blur: false },
            ],
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));

      const pictorial = result.current.pictorials[0];
      expect(pictorial.id).toBe('gen-1');
      expect(pictorial.projectId).toBe('project-1');
      expect(pictorial.projectName).toBe('My Wedding');
      expect(pictorial.images).toHaveLength(2);
      expect(pictorial.completedAt).toBe('2024-01-15T12:00:00Z');
      expect(pictorial.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(pictorial.themeName).toBeNull();
      expect(pictorial.themeDisplayNameKo).toBeNull();
    });

    it('should handle project with null name', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          name: null,
          latestGeneration: createMockLatestGeneration({ id: 'gen-1' }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials[0].projectName).toBeNull();
    });

    it('should use createdAt as fallback when completedAt is null', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-1',
            completedAt: null,
            createdAt: '2024-01-15T10:00:00Z',
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));
      expect(result.current.pictorials[0].completedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('sorting', () => {
    it('should sort pictorials by completedAt date (newest first)', () => {
      const projects = [
        createMockProject({
          id: 'project-old',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-old',
            completedAt: '2024-01-01T00:00:00Z',
          }),
        }),
        createMockProject({
          id: 'project-new',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-new',
            completedAt: '2024-01-15T00:00:00Z',
          }),
        }),
        createMockProject({
          id: 'project-mid',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-mid',
            completedAt: '2024-01-08T00:00:00Z',
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));

      expect(result.current.pictorials[0].id).toBe('gen-new');
      expect(result.current.pictorials[1].id).toBe('gen-mid');
      expect(result.current.pictorials[2].id).toBe('gen-old');
    });
  });

  describe('pictorial data structure', () => {
    it('should include all required pictorial fields', () => {
      const projects = [
        createMockProject({
          id: 'project-1',
          name: 'Wedding Day',
          latestGeneration: createMockLatestGeneration({
            id: 'gen-1',
            completedAt: '2024-01-15T12:00:00Z',
            createdAt: '2024-01-15T10:00:00Z',
            images: [{ url: 'https://example.com/img.jpg', is_blur: false }],
          }),
        }),
      ];

      const { result } = renderHook(() => useCompletedGenerations(projects));

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
});
