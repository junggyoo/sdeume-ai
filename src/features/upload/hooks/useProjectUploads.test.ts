import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProjectUploads } from './useProjectUploads';
import type { Upload } from '../types';

// Mock the supabase browser client
vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  })),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock uploads
const createMockUpload = (overrides: Partial<Upload> = {}): Upload => ({
  id: 'upload-1',
  projectId: 'project-1',
  userId: 'user-1',
  role: 'groom',
  originalUrl: 'https://example.com/image.jpg',
  croppedUrl: null,
  bucketType: 'A',
  faceYaw: 5,
  smileScore: 0.3,
  qualityScore: 0.9,
  isSelected: true,
  cropMode: 'original',
  cropRect: null,
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

describe('useProjectUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching uploads', () => {
    it('should fetch uploads for a project', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom' }),
        createMockUpload({ id: 'upload-2', role: 'bride' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.uploads).toHaveLength(2);
      expect(result.current.uploads).toEqual(mockUploads);
    });

    it('should filter uploads by groom role', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom' }),
        createMockUpload({ id: 'upload-2', role: 'groom' }),
        createMockUpload({ id: 'upload-3', role: 'bride' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groomUploads).toHaveLength(2);
      expect(result.current.groomUploads.every((u) => u.role === 'groom')).toBe(
        true
      );
    });

    it('should filter uploads by bride role', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom' }),
        createMockUpload({ id: 'upload-2', role: 'bride' }),
        createMockUpload({ id: 'upload-3', role: 'bride' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.brideUploads).toHaveLength(2);
      expect(result.current.brideUploads.every((u) => u.role === 'bride')).toBe(
        true
      );
    });

    it('should return counts for each role', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom' }),
        createMockUpload({ id: 'upload-2', role: 'groom' }),
        createMockUpload({ id: 'upload-3', role: 'bride' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groomCount).toBe(2);
      expect(result.current.brideCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ ok: false, error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.uploads).toEqual([]);
    });

    it('should return empty arrays when no projectId is provided', async () => {
      const { result } = renderHook(() => useProjectUploads(''), {
        wrapper: createWrapper(),
      });

      // Should not make fetch call for empty projectId
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.uploads).toEqual([]);
      expect(result.current.groomUploads).toEqual([]);
      expect(result.current.brideUploads).toEqual([]);
    });
  });

  describe('bucket summary calculation', () => {
    it('should calculate bucket summary for groom uploads', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom', bucketType: 'A' }),
        createMockUpload({ id: 'upload-2', role: 'groom', bucketType: 'A' }),
        createMockUpload({ id: 'upload-3', role: 'groom', bucketType: 'B' }),
        createMockUpload({ id: 'upload-4', role: 'groom', bucketType: 'C' }),
        createMockUpload({ id: 'upload-5', role: 'groom', bucketType: 'D' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const groomSummary = result.current.groomBucketSummary;
      expect(groomSummary.bucketA).toBe(2);
      expect(groomSummary.bucketB).toBe(1);
      expect(groomSummary.bucketC).toBe(1);
      expect(groomSummary.bucketD).toBe(1);
      expect(groomSummary.total).toBe(5);
      expect(groomSummary.usableCount).toBe(4); // A + B + C
    });

    it('should calculate bucket summary for bride uploads', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'bride', bucketType: 'A' }),
        createMockUpload({ id: 'upload-2', role: 'bride', bucketType: 'B' }),
        createMockUpload({ id: 'upload-3', role: 'bride', bucketType: 'B' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const brideSummary = result.current.brideBucketSummary;
      expect(brideSummary.bucketA).toBe(1);
      expect(brideSummary.bucketB).toBe(2);
      expect(brideSummary.bucketC).toBe(0);
      expect(brideSummary.bucketD).toBe(0);
      expect(brideSummary.total).toBe(3);
      expect(brideSummary.usableCount).toBe(3);
    });

    it('should handle uploads without bucketType', async () => {
      const mockUploads = [
        createMockUpload({ id: 'upload-1', role: 'groom', bucketType: null }),
        createMockUpload({ id: 'upload-2', role: 'groom', bucketType: 'A' }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const groomSummary = result.current.groomBucketSummary;
      expect(groomSummary.bucketA).toBe(1);
      expect(groomSummary.total).toBe(2);
    });
  });

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const mockUploads = [createMockUpload()];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockUploads }),
      });

      const { result } = renderHook(() => useProjectUploads('project-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
