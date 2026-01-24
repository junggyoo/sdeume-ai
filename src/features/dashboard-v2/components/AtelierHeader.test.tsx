import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtelierHeader } from './AtelierHeader';
import type { DashboardStateResult } from '@/features/dashboard/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement('a', { href, ...props }, children),
}));

// Mock UserMenu
vi.mock('./UserMenu', () => ({
  UserMenu: ({ className }: { className?: string }) => (
    <div data-testid="user-menu" className={className}>
      UserMenu
    </div>
  ),
}));

// Mock useDashboardState
const mockUseDashboardState = vi.fn<() => DashboardStateResult>();
vi.mock('@/features/dashboard', () => ({
  useDashboardState: () => mockUseDashboardState(),
}));

// Mock useCurrentUser
vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { email: 'test@example.com', userMetadata: { name: 'Test User' } },
  }),
}));

// Helper to create mock dashboard state
const createMockDashboardState = (
  overrides: Partial<DashboardStateResult> = {}
): DashboardStateResult => ({
  state: 'onboarding',
  processingProject: null,
  completedProjects: [],
  failedProjects: [],
  allProjects: [],
  hasFaceModel: false,
  isLoading: false,
  ...overrides,
});

describe('AtelierHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: ready state with completed projects
    mockUseDashboardState.mockReturnValue(
      createMockDashboardState({
        state: 'ready',
        completedProjects: [{ id: '1', status: 'completed' }] as DashboardStateResult['completedProjects'],
      })
    );
  });

  describe('Brand Rendering', () => {
    it('should render brand name', () => {
      render(<AtelierHeader />);

      expect(screen.getByText('Sdeume AI')).toBeInTheDocument();
    });

    it('should render Sparkles icon', () => {
      render(<AtelierHeader />);

      // Sparkles icon is an SVG with lucide-sparkles class
      const sparklesIcon = document.querySelector('.lucide-sparkles');
      expect(sparklesIcon).toBeInTheDocument();
    });

    it('should use serif font for brand name', () => {
      render(<AtelierHeader />);

      const brandName = screen.getByText('Sdeume AI');
      expect(brandName.className).toMatch(/font-serif/);
    });

    it('should link brand to dashboard', () => {
      render(<AtelierHeader />);

      const brandLink = screen.getByRole('link');
      expect(brandLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Status Badge', () => {
    it('should render status label', () => {
      render(<AtelierHeader />);

      expect(screen.getByText(/스튜디오 상태/)).toBeInTheDocument();
    });

    it('should render status indicator dot', () => {
      render(<AtelierHeader />);

      // Status indicator with green color
      const indicator = document.querySelector('.bg-green-500.rounded-full');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Studio Status Logic', () => {
    it('should show "대기 중" (idle) when onboarding state', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({ state: 'onboarding' })
      );

      render(<AtelierHeader />);

      expect(screen.getByText(/대기 중/)).toBeInTheDocument();
      const indicator = document.querySelector('.bg-gray-400.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should show "생성 중" (processing) when processing state', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({
          state: 'processing',
          processingProject: { id: '1', status: 'training' } as DashboardStateResult['processingProject'],
        })
      );

      render(<AtelierHeader />);

      expect(screen.getByText(/생성 중/)).toBeInTheDocument();
      const indicator = document.querySelector('.bg-amber-500.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should show "완료" (completed) when there are completed projects', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({
          state: 'ready',
          completedProjects: [{ id: '1', status: 'completed' }] as DashboardStateResult['completedProjects'],
        })
      );

      render(<AtelierHeader />);

      expect(screen.getByText(/완료/)).toBeInTheDocument();
      const indicator = document.querySelector('.bg-green-500.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    // BUG FIX TEST: This is the core test for the bug
    it('should show "대기 중" (idle) when hasFaceModel but no completed projects', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({
          state: 'ready', // ready because hasFaceModel
          hasFaceModel: true,
          completedProjects: [], // but no completed projects!
        })
      );

      render(<AtelierHeader />);

      // Should NOT show "완료" - this is the bug we're fixing
      expect(screen.getByText(/대기 중/)).toBeInTheDocument();
      const indicator = document.querySelector('.bg-gray-400.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should show "완료" when there are completed generations', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({
          state: 'ready',
          completedProjects: [],
          allProjects: [
            {
              id: '1',
              status: 'completed',
              latestGeneration: { status: 'completed' },
            },
          ] as DashboardStateResult['allProjects'],
        })
      );

      render(<AtelierHeader />);

      expect(screen.getByText(/완료/)).toBeInTheDocument();
    });

    it('should show "생성 중" (processing) when processingProject exists regardless of state', () => {
      mockUseDashboardState.mockReturnValue(
        createMockDashboardState({
          state: 'ready', // state는 ready지만 processingProject 존재
          processingProject: { id: '1', status: 'training' } as DashboardStateResult['processingProject'],
        })
      );

      render(<AtelierHeader />);

      expect(screen.getByText(/생성 중/)).toBeInTheDocument();
      const indicator = document.querySelector('.bg-amber-500.rounded-full');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('UserMenu Integration', () => {
    it('should render UserMenu component', () => {
      render(<AtelierHeader />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should position UserMenu on the right', () => {
      render(<AtelierHeader />);

      // flex 레이아웃은 inner container에 적용됨
      const innerContainer = screen.getByTestId('header-inner');
      expect(innerContainer.className).toMatch(/flex/);
      expect(innerContainer.className).toMatch(/justify-between/);
    });
  });

  describe('Scroll State - Default (Not Scrolled)', () => {
    it('should have transparent background when not scrolled', () => {
      render(<AtelierHeader isScrolled={false} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/bg-transparent/);
    });

    it('should have default height (h-24) when not scrolled', () => {
      render(<AtelierHeader isScrolled={false} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/h-24/);
    });

    it('should not have backdrop-blur when not scrolled', () => {
      render(<AtelierHeader isScrolled={false} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).not.toMatch(/backdrop-blur-xl/);
    });
  });

  describe('Scroll State - Scrolled', () => {
    it('should apply backdrop-blur when scrolled', () => {
      render(<AtelierHeader isScrolled={true} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/backdrop-blur-xl/);
    });

    it('should have reduced height (h-20) when scrolled', () => {
      render(<AtelierHeader isScrolled={true} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/h-20/);
    });

    it('should have white background with opacity when scrolled', () => {
      render(<AtelierHeader isScrolled={true} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/bg-white\/70/);
    });

    it('should have shadow when scrolled', () => {
      render(<AtelierHeader isScrolled={true} />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/shadow-sm/);
    });
  });

  describe('Sticky Positioning', () => {
    it('should be fixed positioned', () => {
      render(<AtelierHeader />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/fixed/);
    });

    it('should be positioned at top', () => {
      render(<AtelierHeader />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/top-0/);
    });

    it('should span full width', () => {
      render(<AtelierHeader />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/left-0/);
      expect(header.className).toMatch(/right-0/);
    });

    it('should have high z-index', () => {
      render(<AtelierHeader />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/z-50/);
    });
  });

  describe('Transition', () => {
    it('should have transition classes for smooth scroll effect', () => {
      render(<AtelierHeader />);

      const header = screen.getByTestId('atelier-header');
      expect(header.className).toMatch(/transition/);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<AtelierHeader className="custom-header-class" />);

      const header = screen.getByTestId('atelier-header');
      expect(header).toHaveClass('custom-header-class');
    });
  });

  describe('Accessibility', () => {
    it('should have banner role', () => {
      render(<AtelierHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have navigation landmark', () => {
      render(<AtelierHeader />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have max-width container', () => {
      render(<AtelierHeader />);

      const innerContainer = screen.getByTestId('header-inner');
      expect(innerContainer.className).toMatch(/max-w-/);
    });

    it('should have horizontal padding', () => {
      render(<AtelierHeader />);

      const innerContainer = screen.getByTestId('header-inner');
      expect(innerContainer.className).toMatch(/px-/);
    });

    it('should center content', () => {
      render(<AtelierHeader />);

      const innerContainer = screen.getByTestId('header-inner');
      expect(innerContainer.className).toMatch(/mx-auto/);
    });
  });
});
