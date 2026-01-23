import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Step1Page from './page';

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParamsGet = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

// Mock history.replaceState
const mockReplaceState = vi.fn();
Object.defineProperty(window, 'history', {
  value: {
    replaceState: mockReplaceState,
  },
  writable: true,
});

// Mock useProjectUploads hook
const mockUseProjectUploads = vi.fn();
vi.mock('@/features/upload/hooks/useProjectUploads', () => ({
  useProjectUploads: (projectId: string) => mockUseProjectUploads(projectId),
}));

// Mock react-query
const mockMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Mock upload store
const mockSetActiveRole = vi.fn();
const mockGetBucketSummary = vi.fn(() => ({ total: 5 }));
vi.mock('@/features/upload/store/upload-store', () => ({
  useUploadStore: () => ({
    activeRole: 'groom',
    setActiveRole: mockSetActiveRole,
    getBucketSummary: mockGetBucketSummary,
  }),
}));

// Mock useBulkUpload hook
vi.mock('@/features/upload/hooks/useBulkUpload', () => ({
  useBulkUpload: () => ({
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    queue: [],
    isProcessing: false,
    processingCount: 0,
  }),
}));

// Mock useUploadToStorage hook
const mockSyncUploadsToServer = vi.fn();
vi.mock('@/features/upload/hooks/useUploadToStorage', () => ({
  useUploadToStorage: () => ({
    syncUploadsToServer: mockSyncUploadsToServer,
    isSyncing: false,
    syncProgress: 0,
    syncTotal: 0,
  }),
}));

// Mock useFaceDataStatus hook
vi.mock('@/features/face/hooks/useUserFaceModels', () => ({
  useFaceDataStatus: () => ({
    hasBothFaces: true,
  }),
}));

// Mock face-mesh preload
vi.mock('@/features/upload/lib/face-mesh', () => ({
  preloadFaceModels: vi.fn(() => Promise.resolve()),
}));

// Mock upload-v2 components
vi.mock('@/features/upload-v2', () => ({
  AtelierUploadHeader: ({
    onRoleChange,
  }: {
    activeRole: string;
    onRoleChange: (role: string) => void;
    groomCount: number;
    brideCount: number;
    hasBothFaces: boolean;
  }) => (
    <div data-testid="atelier-upload-header">
      <button onClick={() => onRoleChange('bride')}>Switch Role</button>
    </div>
  ),
  AtelierDropzone: () => <div data-testid="atelier-dropzone" />,
  AtelierPhotoGrid: () => <div data-testid="atelier-photo-grid" />,
  CircularProgressWidget: ({
    onNext,
    isLoading,
  }: {
    groomCount: number;
    brideCount: number;
    onNext: () => void;
    isLoading: boolean;
    isSyncing: boolean;
  }) => (
    <div data-testid="circular-progress-widget">
      <button
        data-testid="next-button"
        onClick={onNext}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        다음
      </button>
    </div>
  ),
  QuickGuideWidget: () => <div data-testid="quick-guide-widget" />,
}));

// Mock UploadProgress component
vi.mock('@/features/upload/components/UploadProgress', () => ({
  UploadProgress: () => <div data-testid="upload-progress" />,
}));

// Mock api-client
vi.mock('@/lib/remote/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('Step1Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: 'project-123', name: 'Test Project' });
    mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);
    // Default: Fresh Mode (no projectId in URL)
    mockSearchParamsGet.mockReturnValue(null);
    // Default: Empty existing uploads
    mockUseProjectUploads.mockReturnValue({
      uploads: [],
      groomUploads: [],
      brideUploads: [],
      groomCount: 0,
      brideCount: 0,
      groomBucketSummary: { bucketA: 0, bucketB: 0, bucketC: 0, bucketD: 0, total: 0, usableCount: 0 },
      brideBucketSummary: { bucketA: 0, bucketB: 0, bucketC: 0, bucketD: 0, total: 0, usableCount: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('렌더링', () => {
    it('should render upload components', () => {
      render(<Step1Page />);

      expect(screen.getByTestId('atelier-upload-header')).toBeInTheDocument();
      expect(screen.getByTestId('atelier-dropzone')).toBeInTheDocument();
      expect(screen.getByTestId('atelier-photo-grid')).toBeInTheDocument();
      expect(screen.getByTestId('circular-progress-widget')).toBeInTheDocument();
      expect(screen.getByTestId('quick-guide-widget')).toBeInTheDocument();
    });
  });

  describe('handleNext - 중복 클릭 방지', () => {
    it('should prevent multiple project creations on rapid clicks', async () => {
      const user = userEvent.setup();

      // Make mutateAsync take some time to complete
      mockMutateAsync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 'project-123' }), 100)
          )
      );

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');

      // Rapid clicks
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      // Wait for any pending operations
      await waitFor(() => {
        // Project creation should only be called once
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable button immediately when clicked', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 'project-123' }), 100)
          )
      );

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();

      await user.click(nextButton);

      // Button should be disabled or show loading state
      await waitFor(() => {
        expect(nextButton).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  describe('handleNext - 프로젝트 재사용', () => {
    it('should reuse existing project on upload failure retry', async () => {
      const user = userEvent.setup();

      // First call: create project, upload fails
      mockMutateAsync.mockResolvedValueOnce({ id: 'project-123' });
      mockSyncUploadsToServer
        .mockResolvedValueOnce([]) // First attempt: upload fails
        .mockResolvedValueOnce([{ id: 'upload-1' }]); // Second attempt: upload succeeds

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');

      // First click - upload fails
      await user.click(nextButton);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });

      // Wait for error state to clear
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second click - should reuse project
      await user.click(nextButton);
      await waitFor(() => {
        // Project creation should still only be called once (reusing existing)
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should reuse existing project on error retry', async () => {
      const user = userEvent.setup();

      // First call: create project, then error
      mockMutateAsync.mockResolvedValueOnce({ id: 'project-123' });
      mockSyncUploadsToServer
        .mockRejectedValueOnce(new Error('Network error')) // First attempt: error
        .mockResolvedValueOnce([{ id: 'upload-1' }]); // Second attempt: success

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');

      // First click - error occurs
      await user.click(nextButton);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });

      // Wait for error state to clear
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second click - should reuse project
      await user.click(nextButton);
      await waitFor(() => {
        // Project creation should still only be called once (reusing existing)
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass projectIdOverride to syncUploadsToServer', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockResolvedValue({ id: 'project-456' });
      mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        // Both groom and bride sync should be called with projectIdOverride
        expect(mockSyncUploadsToServer).toHaveBeenCalledWith('groom', {
          projectIdOverride: 'project-456',
        });
        expect(mockSyncUploadsToServer).toHaveBeenCalledWith('bride', {
          projectIdOverride: 'project-456',
        });
      });
    });
  });

  describe('handleNext - 네비게이션', () => {
    it('should navigate to step2 on successful upload', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockResolvedValue({ id: 'project-789' });
      mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/new-shoot/project-789/step2');
      });
    });

    it('should not navigate when both uploads return empty', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockResolvedValue({ id: 'project-123' });
      mockSyncUploadsToServer.mockResolvedValue([]); // Both return empty

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleNext - 에러 처리', () => {
    it('should display error message on upload failure', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockResolvedValue({ id: 'project-123' });
      mockSyncUploadsToServer.mockResolvedValue([]); // Upload fails

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByText('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
        ).toBeInTheDocument();
      });
    });

    it('should display error message on exception', async () => {
      const user = userEvent.setup();

      mockMutateAsync.mockRejectedValue(new Error('프로젝트 생성 실패'));

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('프로젝트 생성 실패')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode - URL 파라미터로 projectId 전달', () => {
    it('should skip project creation when projectId exists in URL', async () => {
      const user = userEvent.setup();

      // Edit Mode: projectId in URL
      mockSearchParamsGet.mockReturnValue('existing-project-123');
      mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        // Project creation should NOT be called (using existing projectId)
        expect(mockMutateAsync).not.toHaveBeenCalled();
        // Navigation should use existing projectId
        expect(mockPush).toHaveBeenCalledWith('/new-shoot/existing-project-123/step2');
      });
    });

    it('should use history.replaceState after creating new project in fresh mode', async () => {
      const user = userEvent.setup();

      // Fresh Mode: no projectId in URL
      mockSearchParamsGet.mockReturnValue(null);
      mockMutateAsync.mockResolvedValue({ id: 'new-project-456' });
      mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        // Should call replaceState with new projectId
        expect(mockReplaceState).toHaveBeenCalledWith(
          null,
          '',
          '/new-shoot/step1?projectId=new-project-456'
        );
      });
    });

    it('should NOT call history.replaceState when in edit mode', async () => {
      const user = userEvent.setup();

      // Edit Mode: projectId already in URL
      mockSearchParamsGet.mockReturnValue('existing-project-123');
      mockSyncUploadsToServer.mockResolvedValue([{ id: 'upload-1' }]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Should NOT call replaceState (URL already has projectId)
      expect(mockReplaceState).not.toHaveBeenCalled();
    });

    it('should fetch existing uploads when projectId exists', () => {
      // Edit Mode: projectId in URL
      mockSearchParamsGet.mockReturnValue('project-with-uploads');

      render(<Step1Page />);

      // useProjectUploads should be called with the projectId
      expect(mockUseProjectUploads).toHaveBeenCalledWith('project-with-uploads');
    });

    it('should pass empty string to useProjectUploads when no projectId in URL', () => {
      // Fresh Mode: no projectId
      mockSearchParamsGet.mockReturnValue(null);

      render(<Step1Page />);

      // useProjectUploads should be called with empty string
      expect(mockUseProjectUploads).toHaveBeenCalledWith('');
    });

    it('should proceed to step2 with existing uploads (no local queue)', async () => {
      const user = userEvent.setup();

      // Edit Mode with existing uploads, empty local queue
      mockSearchParamsGet.mockReturnValue('existing-project-123');
      mockUseProjectUploads.mockReturnValue({
        uploads: [{ id: 'existing-upload-1', role: 'groom' }],
        groomUploads: [{ id: 'existing-upload-1', role: 'groom' }],
        brideUploads: [],
        groomCount: 1,
        brideCount: 0,
        groomBucketSummary: { bucketA: 1, bucketB: 0, bucketC: 0, bucketD: 0, total: 1, usableCount: 1 },
        brideBucketSummary: { bucketA: 0, bucketB: 0, bucketC: 0, bucketD: 0, total: 0, usableCount: 0 },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });
      // Empty sync result (no NEW uploads to sync)
      mockSyncUploadsToServer.mockResolvedValue([]);

      render(<Step1Page />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      await waitFor(() => {
        // Should still navigate (existing uploads are sufficient)
        expect(mockPush).toHaveBeenCalledWith('/new-shoot/existing-project-123/step2');
      });
    });
  });
});
