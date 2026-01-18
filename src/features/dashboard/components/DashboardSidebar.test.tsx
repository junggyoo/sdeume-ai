import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from './DashboardSidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('DashboardSidebar', () => {
  describe('Rendering', () => {
    it('should render the sidebar container', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    });

    it('should render brand section', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('brand-section')).toBeInTheDocument();
    });

    it('should render navigation section', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument();
    });

    it('should render plan usage section', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('plan-usage-section')).toBeInTheDocument();
    });
  });

  describe('Brand Section', () => {
    it('should display brand name', () => {
      render(<DashboardSidebar />);

      expect(screen.getByText('스드메 AI')).toBeInTheDocument();
    });

    it('should display brand subtitle', () => {
      render(<DashboardSidebar />);

      expect(screen.getByText('AI 웨딩 스튜디오')).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('should render my studio link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /마이 스튜디오/i })).toBeInTheDocument();
    });

    it('should render gallery link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /갤러리/i })).toBeInTheDocument();
    });

    it('should render face management link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /내 얼굴 관리/i })).toBeInTheDocument();
    });

    it('should render my plan link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /내 플랜/i })).toBeInTheDocument();
    });

    it('should render help link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /도움말/i })).toBeInTheDocument();
    });

    it('should render settings link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /설정/i })).toBeInTheDocument();
    });
  });

  describe('Gallery Count Badge', () => {
    it('should not show gallery count when zero', () => {
      render(<DashboardSidebar galleryCount={0} />);

      const galleryLink = screen.getByRole('link', { name: /갤러리/i });
      expect(galleryLink).not.toHaveTextContent('0');
    });

    it('should show gallery count when greater than zero', () => {
      render(<DashboardSidebar galleryCount={15} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('Face Model Indicator', () => {
    it('should not show active indicator when hasFaceModel is false', () => {
      render(<DashboardSidebar hasFaceModel={false} />);

      expect(screen.queryByTestId('face-active-indicator')).not.toBeInTheDocument();
    });

    it('should show active indicator when hasFaceModel is true', () => {
      render(<DashboardSidebar hasFaceModel={true} />);

      expect(screen.getByTestId('face-active-indicator')).toBeInTheDocument();
    });
  });

  describe('Plan Badge', () => {
    it('should not show Pro badge when planType is free', () => {
      render(<DashboardSidebar planType="free" />);

      expect(screen.queryByText('Pro')).not.toBeInTheDocument();
    });

    it('should show Pro badge when planType is pro', () => {
      render(<DashboardSidebar planType="pro" />);

      // Pro badge appears in both nav and usage section
      expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Plan Usage Section', () => {
    it('should display remaining count', () => {
      render(<DashboardSidebar remainingCount={24} />);

      expect(screen.getByText('24장 남음')).toBeInTheDocument();
    });

    it('should render upgrade link', () => {
      render(<DashboardSidebar />);

      expect(screen.getByText('업그레이드')).toBeInTheDocument();
    });

    it('should render usage progress bar', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('usage-progress-bar')).toBeInTheDocument();
    });

    it('should calculate progress bar width correctly', () => {
      render(<DashboardSidebar remainingCount={15} totalCount={30} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      // (30 - 15) / 30 * 100 = 50%
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should show 0% progress when all remaining', () => {
      render(<DashboardSidebar remainingCount={30} totalCount={30} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should show 100% progress when none remaining', () => {
      render(<DashboardSidebar remainingCount={0} totalCount={30} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Active State', () => {
    it('should highlight active navigation item based on pathname', () => {
      // Mock returns '/dashboard' so my studio should be active
      render(<DashboardSidebar />);

      const myStudioLink = screen.getByRole('link', { name: /마이 스튜디오/i });
      expect(myStudioLink).toHaveClass('bg-primary-desktop/10');
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      render(<DashboardSidebar className="custom-class" />);

      const sidebar = screen.getByTestId('dashboard-sidebar');
      expect(sidebar).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<DashboardSidebar className="bg-red-500" />);

      const sidebar = screen.getByTestId('dashboard-sidebar');
      expect(sidebar).toHaveClass('bg-red-500');
      expect(sidebar).toHaveClass('flex');
      expect(sidebar).toHaveClass('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('should have navigation landmark role', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have accessible links for all navigation items', () => {
      render(<DashboardSidebar />);

      expect(screen.getByRole('link', { name: /마이 스튜디오/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /갤러리/i })).toHaveAttribute('href', '/gallery');
      expect(screen.getByRole('link', { name: /내 얼굴 관리/i })).toHaveAttribute('href', '/face-management');
      expect(screen.getByRole('link', { name: /내 플랜/i })).toHaveAttribute('href', '/plan');
      expect(screen.getByRole('link', { name: /도움말/i })).toHaveAttribute('href', '/help');
      expect(screen.getByRole('link', { name: /설정/i })).toHaveAttribute('href', '/settings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total count without division error', () => {
      render(<DashboardSidebar remainingCount={0} totalCount={0} />);

      const progressBar = screen.getByTestId('usage-progress-bar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should render with all default props', () => {
      render(<DashboardSidebar />);

      expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
      expect(screen.getByText('0장 남음')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });
});
