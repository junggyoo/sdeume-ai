import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock apiClient
vi.mock('@/lib/remote/api-client', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({
      data: {
        ok: true,
        data: { id: 'new-project-id', name: 'Test Project' },
      },
    }),
  },
}));

// Mock useFaceDataStatus
const mockUseFaceDataStatus = vi.fn();
vi.mock('@/features/face/hooks/useUserFaceModels', () => ({
  useFaceDataStatus: () => mockUseFaceDataStatus(),
}));

import { useSmartNavigation } from './useSmartNavigation';

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

describe('useSmartNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFaceDataStatus.mockReturnValue({
      data: null,
      isLoading: false,
      hasBothFaces: false,
      hasAnyFace: false,
    });
  });

  describe('goBackFromStep2', () => {
    /**
     * Requirements:
     * - If user has both faces (returning user): navigate to /dashboard
     * - If user is new (no faces): navigate to /new-shoot/step1
     */

    it('should navigate to /dashboard when user has both faces (returning user)', () => {
      // Arrange: User has both faces
      mockUseFaceDataStatus.mockReturnValue({
        data: { hasBothFaces: true },
        isLoading: false,
        hasBothFaces: true,
        hasAnyFace: true,
      });

      // Act
      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.goBackFromStep2();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to /new-shoot/step1 when user is new (no faces)', () => {
      // Arrange: User has no faces
      mockUseFaceDataStatus.mockReturnValue({
        data: null,
        isLoading: false,
        hasBothFaces: false,
        hasAnyFace: false,
      });

      // Act
      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.goBackFromStep2();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/new-shoot/step1');
    });

    it('should navigate to /new-shoot/step1 when user has only one face', () => {
      // Arrange: User has only one face (not both)
      mockUseFaceDataStatus.mockReturnValue({
        data: { hasBothFaces: false },
        isLoading: false,
        hasBothFaces: false,
        hasAnyFace: true, // Has one face
      });

      // Act
      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.goBackFromStep2();
      });

      // Assert: Should go to step1 because they need to complete face registration
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/new-shoot/step1');
    });

  });

  describe('startNewShoot', () => {
    // These tests verify existing functionality is not broken

    it('should navigate to /new-shoot/step1 when user has no faces', async () => {
      mockUseFaceDataStatus.mockReturnValue({
        data: null,
        isLoading: false,
        hasBothFaces: false,
        hasAnyFace: false,
      });

      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.startNewShoot();
      });

      expect(mockPush).toHaveBeenCalledWith('/new-shoot/step1');
    });
  });

  describe('exposed state', () => {
    it('should expose hasBothFaces from useFaceDataStatus', () => {
      mockUseFaceDataStatus.mockReturnValue({
        data: { hasBothFaces: true },
        isLoading: false,
        hasBothFaces: true,
        hasAnyFace: true,
      });

      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasBothFaces).toBe(true);
    });

    it('should expose hasAnyFace from useFaceDataStatus', () => {
      mockUseFaceDataStatus.mockReturnValue({
        data: null,
        isLoading: false,
        hasBothFaces: false,
        hasAnyFace: true,
      });

      const { result } = renderHook(() => useSmartNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasAnyFace).toBe(true);
    });
  });
});
