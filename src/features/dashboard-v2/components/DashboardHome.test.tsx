import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHome } from './DashboardHome';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt, ...props }),
}));

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

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      whileHover,
      ...props
    }: {
      children: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      whileHover?: unknown;
      [key: string]: unknown;
    }) => React.createElement('div', props, children),
    section: ({
      children,
      initial,
      animate,
      transition,
      ...props
    }: {
      children: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => React.createElement('section', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock ProjectCard
vi.mock('./ProjectCard', () => ({
  ProjectCard: ({
    type,
    title,
    onClick,
    'data-testid': testId,
  }: {
    type: string;
    title?: string;
    onClick?: () => void;
    'data-testid'?: string;
  }) => (
    <div
      data-testid={testId || `project-card-${type}`}
      data-type={type}
      data-title={title}
      onClick={onClick}
    >
      {type === 'new' ? 'Start New Shooting' : title}
    </div>
  ),
}));

// Mock FeaturedThemeWidget
vi.mock('./FeaturedThemeWidget', () => ({
  FeaturedThemeWidget: () => (
    <div data-testid="featured-theme-widget">Featured Theme</div>
  ),
}));

// Mock LookbookCard
vi.mock('./LookbookCard', () => ({
  LookbookCard: ({ themeName }: { themeName: string }) => (
    <div data-testid="lookbook-card">{themeName}</div>
  ),
}));

describe('DashboardHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Grid Layout', () => {
    it('should render with 12 column grid structure', () => {
      render(<DashboardHome />);

      const container = screen.getByTestId('dashboard-home');
      expect(container.className).toMatch(/grid/);
      expect(container.className).toMatch(/grid-cols-12/);
    });

    it('should have main content area spanning 8 columns on large screens', () => {
      render(<DashboardHome />);

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent.className).toMatch(/lg:col-span-8/);
    });

    it('should have side content area spanning 4 columns on large screens', () => {
      render(<DashboardHome />);

      const sideContent = screen.getByTestId('side-content');
      expect(sideContent.className).toMatch(/lg:col-span-4/);
    });

    it('should stack columns on mobile (full width)', () => {
      render(<DashboardHome />);

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent.className).toMatch(/col-span-12/);
    });
  });

  describe('Greeting Section', () => {
    it('should render greeting text', () => {
      render(<DashboardHome />);

      expect(screen.getByText(/Good Afternoon,/)).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<DashboardHome />);

      expect(screen.getByText(/Your studio is ready/)).toBeInTheDocument();
    });

    it('should use serif font for greeting text', () => {
      render(<DashboardHome />);

      const welcomeHeading = screen.getByRole('heading', { level: 1 });
      expect(welcomeHeading.className).toMatch(/font-serif/);
    });

    it('should display user name with gradient styling', () => {
      render(<DashboardHome />);

      // User name should be styled with gradient
      const userName = screen.getByText(/Ji-min/);
      expect(userName.className).toMatch(/text-transparent/);
      expect(userName.className).toMatch(/bg-clip-text/);
    });
  });

  describe('Project Card Grid', () => {
    it('should render project cards section', () => {
      render(<DashboardHome />);

      const projectSection = screen.getByTestId('projects-section');
      expect(projectSection).toBeInTheDocument();
    });

    it('should render new project card as first item', () => {
      render(<DashboardHome />);

      const projectCards = screen.getAllByTestId(/project-card/);
      const firstCard = projectCards[0];
      expect(firstCard).toHaveAttribute('data-type', 'new');
    });

    it('should call onStartNew when new project card is clicked', async () => {
      const handleStartNew = vi.fn();
      const user = userEvent.setup();

      render(<DashboardHome onStartNew={handleStartNew} />);

      const newCard = screen.getByTestId('project-card-new');
      await user.click(newCard);

      expect(handleStartNew).toHaveBeenCalledTimes(1);
    });

    it('should render project cards in a 2-column grid layout', () => {
      render(<DashboardHome />);

      const projectsGrid = screen.getByTestId('projects-grid');
      expect(projectsGrid.className).toMatch(/grid/);
      expect(projectsGrid.className).toMatch(/grid-cols-2/);
    });
  });

  describe('Curated Lookbook Section', () => {
    it('should render lookbook section', () => {
      render(<DashboardHome />);

      const lookbookSection = screen.getByTestId('lookbook-section');
      expect(lookbookSection).toBeInTheDocument();
    });

    it('should display Curated Lookbook title', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Curated Lookbook')).toBeInTheDocument();
    });

    it('should display View All button', () => {
      render(<DashboardHome />);

      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('should render lookbook cards', () => {
      render(<DashboardHome />);

      const lookbookCards = screen.getAllByTestId('lookbook-card');
      expect(lookbookCards.length).toBeGreaterThan(0);
    });
  });

  describe('Side Widgets', () => {
    it('should render tip widget', () => {
      render(<DashboardHome />);

      const tipWidget = screen.getByTestId('tip-widget');
      expect(tipWidget).toBeInTheDocument();
    });

    it('should display Artist\'s Tip title', () => {
      render(<DashboardHome />);

      expect(screen.getByText("Artist's Tip")).toBeInTheDocument();
    });

    it('should render theme widget with FeaturedThemeWidget', () => {
      render(<DashboardHome />);

      const themeWidget = screen.getByTestId('theme-widget');
      expect(themeWidget).toBeInTheDocument();
      expect(screen.getByTestId('featured-theme-widget')).toBeInTheDocument();
    });

    it('should render membership widget', () => {
      render(<DashboardHome />);

      const membershipWidget = screen.getByTestId('membership-widget');
      expect(membershipWidget).toBeInTheDocument();
    });

    it('should display My Membership title', () => {
      render(<DashboardHome />);

      expect(screen.getByText('My Membership')).toBeInTheDocument();
    });

    it('should display upgrade button', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have gap-based layout without visible borders', () => {
      render(<DashboardHome />);

      const container = screen.getByTestId('dashboard-home');
      expect(container.className).toMatch(/gap/);
    });

    it('should have appropriate spacing', () => {
      render(<DashboardHome />);

      const container = screen.getByTestId('dashboard-home');
      expect(container.className).toMatch(/gap-/);
    });

    it('should have glass morphism on tip widget', () => {
      render(<DashboardHome />);

      const tipWidget = screen.getByTestId('tip-widget');
      expect(tipWidget.className).toMatch(/backdrop-blur/);
    });

    it('should have dark gradient on membership widget', () => {
      render(<DashboardHome />);

      const membershipWidget = screen.getByTestId('membership-widget');
      expect(membershipWidget.className).toMatch(/bg-gradient-to-br/);
      expect(membershipWidget.className).toMatch(/from-\[#191F28\]/);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<DashboardHome className="custom-dashboard-class" />);

      const container = screen.getByTestId('dashboard-home');
      expect(container).toHaveClass('custom-dashboard-class');
    });
  });

  describe('Accessibility', () => {
    it('should have main landmark', () => {
      render(<DashboardHome />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have heading hierarchy', () => {
      render(<DashboardHome />);

      // H1 for main welcome
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      // H2 for section titles
      expect(
        screen.getAllByRole('heading', { level: 2 }).length
      ).toBeGreaterThan(0);
    });
  });
});
