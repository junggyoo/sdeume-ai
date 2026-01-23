import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2Page from './page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'test-project-123' }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock project hooks
vi.mock('@/features/project/hooks/useProject', () => ({
  useProject: () => ({
    data: { id: 'test-project-123', selectedThemeId: null },
  }),
}));

const mockMutateAsync = vi.fn();
vi.mock('@/features/project/hooks/useUpdateProject', () => ({
  useUpdateProject: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock theme hooks
vi.mock('@/features/theme/hooks/useThemes', () => ({
  useThemes: () => ({
    data: [
      {
        id: 'garden_studio',
        name: '가든 스튜디오',
        slug: 'garden_studio',
        isRecommended: true,
        thumbnailUrl: null,
        sampleImages: [],
        tags: [],
        displayOrder: 1,
        createdAt: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
}));

// Mock theme UI config
vi.mock('@/features/theme/lib/theme-ui-config', () => ({
  getThemeWithUI: (theme: { id: string; name: string; slug: string; isRecommended: boolean }) => ({
    ...theme,
    ui: {
      nameEn: 'Garden Studio',
      tagline: 'Beautiful garden setting',
    },
  }),
}));

// Mock ThemeSelectionStage component
vi.mock('@/features/theme/components/theme-selection', () => ({
  ThemeSelectionStage: ({
    onBack,
    onNext,
    onSelectTheme,
    isNextDisabled,
    isLoading,
  }: {
    themes: unknown[];
    selectedThemeId: string | null;
    onSelectTheme: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
    isLoading: boolean;
    isNextDisabled: boolean;
  }) => (
    <div data-testid="theme-selection-stage">
      <button data-testid="back-button" onClick={onBack} aria-label="Back">
        Back
      </button>
      <button
        data-testid="select-theme-button"
        onClick={() => onSelectTheme('garden_studio')}
      >
        Select Theme
      </button>
      <button
        data-testid="next-button"
        onClick={onNext}
        disabled={isNextDisabled || isLoading}
      >
        Next
      </button>
    </div>
  ),
}));

describe('Step2Page', () => {
  const projectId = 'test-project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('Back button navigation', () => {
    it('should navigate to step1 with projectId when Back button is clicked', async () => {
      render(<Step2Page />);

      // Find and click the Back button
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      await waitFor(() => {
        // Should navigate to step1 with projectId as query parameter
        expect(mockPush).toHaveBeenCalledWith(`/new-shoot/step1?projectId=${projectId}`);
      });
    });
  });

  describe('theme selection', () => {
    it('should allow selecting a theme', async () => {
      render(<Step2Page />);

      const selectButton = screen.getByTestId('select-theme-button');
      fireEvent.click(selectButton);

      // Theme selection is internal state, verify next button can be clicked
      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('next navigation', () => {
    it('should navigate to step3 when next is clicked with selected theme', async () => {
      render(<Step2Page />);

      // Select a theme first
      const selectButton = screen.getByTestId('select-theme-button');
      fireEvent.click(selectButton);

      // Click next
      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith(`/new-shoot/${projectId}/step3`);
      });
    });
  });
});
