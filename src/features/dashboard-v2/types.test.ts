import { describe, it, expect } from 'vitest';
import {
  getProjectDisplayStatus,
  formatProjectDate,
  getProjectRoute,
  type ProjectDisplayStatus,
} from './types';
import type { Project } from '@/features/project/types';

// Helper to create mock project
const createMockProject = (
  overrides: Partial<Project> = {}
): Project => ({
  id: 'test-project-id',
  userId: 'test-user-id',
  name: 'Test Project',
  status: 'uploading',
  currentStep: 1,
  selectedThemeId: null,
  planId: null,
  groomUploadCount: 0,
  brideUploadCount: 0,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('getProjectDisplayStatus', () => {
  it('should return "processing" for training status', () => {
    const project = createMockProject({ status: 'training' });
    expect(getProjectDisplayStatus(project)).toBe('processing');
  });

  it('should return "processing" for generating status', () => {
    const project = createMockProject({ status: 'generating' });
    expect(getProjectDisplayStatus(project)).toBe('processing');
  });

  it('should return "completed" for completed status', () => {
    const project = createMockProject({ status: 'completed' });
    expect(getProjectDisplayStatus(project)).toBe('completed');
  });

  it('should return "uploading" for uploading status', () => {
    const project = createMockProject({ status: 'uploading' });
    const result: ProjectDisplayStatus = getProjectDisplayStatus(project);
    expect(result).toBe('uploading');
  });

  it('should return "theme_selecting" for theme_selecting status', () => {
    const project = createMockProject({ status: 'theme_selecting' });
    const result: ProjectDisplayStatus = getProjectDisplayStatus(project);
    expect(result).toBe('theme_selecting');
  });

  it('should return "failed" for failed status', () => {
    const project = createMockProject({ status: 'failed' });
    const result: ProjectDisplayStatus = getProjectDisplayStatus(project);
    expect(result).toBe('failed');
  });
});

describe('formatProjectDate', () => {
  it('should format date in Korean locale', () => {
    const result = formatProjectDate('2024-01-15T10:00:00Z');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/1월/);
    expect(result).toMatch(/15/);
  });
});

describe('getProjectRoute', () => {
  describe('uploading status', () => {
    it('should return step2 route for uploading status', () => {
      const project = createMockProject({ status: 'uploading' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/step2');
    });
  });

  describe('theme_selecting status', () => {
    it('should return step3 route for theme_selecting status', () => {
      const project = createMockProject({ status: 'theme_selecting' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/step3');
    });
  });

  describe('training status', () => {
    it('should return progress route for training status', () => {
      const project = createMockProject({ status: 'training' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/progress');
    });
  });

  describe('generating status', () => {
    it('should return progress route for generating status', () => {
      const project = createMockProject({ status: 'generating' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/progress');
    });
  });

  describe('completed status', () => {
    it('should return results route for completed status', () => {
      const project = createMockProject({ status: 'completed' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/results');
    });
  });

  describe('failed status', () => {
    it('should return results route for failed status', () => {
      const project = createMockProject({ status: 'failed' });
      expect(getProjectRoute(project)).toBe('/new-shoot/test-project-id/results');
    });
  });
});
