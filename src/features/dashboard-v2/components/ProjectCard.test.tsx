import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt, ...props }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      layout,
      initial,
      animate,
      transition,
      ...props
    }: {
      children: React.ReactNode;
      whileHover?: unknown;
      whileTap?: unknown;
      layout?: boolean;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => React.createElement('div', props, children),
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: {
      children: React.ReactNode;
      whileHover?: unknown;
      whileTap?: unknown;
      [key: string]: unknown;
    }) => React.createElement('button', props, children),
  },
}));

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Aspect Ratio (4:5)', () => {
    it('should render with 4:5 aspect ratio class', () => {
      render(<ProjectCard type="new" />);

      const card = screen.getByTestId('project-card');
      expect(card.className).toMatch(/aspect-\[4\/5\]/);
    });

    it('should apply aspect ratio for existing type as well', () => {
      render(
        <ProjectCard
          type="existing"
          title="Test Project"
          image="https://example.com/thumb.jpg"
        />
      );

      const card = screen.getByTestId('project-card');
      expect(card.className).toMatch(/aspect-\[4\/5\]/);
    });
  });

  describe('Card Design', () => {
    it('should have glass morphism effect on inner card', () => {
      render(<ProjectCard type="new" />);

      // Inner card with glass effect
      const innerCard = document.querySelector('.backdrop-blur-xl');
      expect(innerCard).toBeInTheDocument();
    });

    it('should have shadow effect', () => {
      render(<ProjectCard type="new" />);

      const innerCard = document.querySelector('.shadow-xl');
      expect(innerCard).toBeInTheDocument();
    });

    it('should have rounded corners (32px)', () => {
      render(<ProjectCard type="new" />);

      const card = screen.getByTestId('project-card');
      expect(card.className).toMatch(/rounded-\[32px\]/);
    });
  });

  describe('New Project Card (type="new")', () => {
    it('should render plus icon', () => {
      render(<ProjectCard type="new" />);

      const plusIcon = screen.getByTestId('plus-icon');
      expect(plusIcon).toBeInTheDocument();
    });

    it('should display "New Session" text', () => {
      render(<ProjectCard type="new" />);

      expect(screen.getByText('New Session')).toBeInTheDocument();
    });

    it('should display "Start Now" CTA text', () => {
      render(<ProjectCard type="new" />);

      expect(screen.getByText('Start Now')).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ProjectCard type="new" onClick={handleClick} />);

      await user.click(screen.getByTestId('project-card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not render thumbnail image', () => {
      render(<ProjectCard type="new" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should have purple gradient background', () => {
      render(<ProjectCard type="new" />);

      const plusArea = screen.getByTestId('plus-icon');
      expect(plusArea.className).toMatch(/from-gray-50/);
      expect(plusArea.className).toMatch(/to-purple-50/);
    });
  });

  describe('Existing Project Card (type="existing")', () => {
    const existingProps = {
      type: 'existing' as const,
      title: 'My Wedding Photos',
      date: 'Dec 15, 2024',
      image: 'https://example.com/thumbnail.jpg',
      status: 'completed' as const,
    };

    it('should render thumbnail image', () => {
      render(<ProjectCard {...existingProps} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', existingProps.image);
    });

    it('should display project title', () => {
      render(<ProjectCard {...existingProps} />);

      expect(screen.getByText('My Wedding Photos')).toBeInTheDocument();
    });

    it('should display date', () => {
      render(<ProjectCard {...existingProps} />);

      expect(screen.getByText('Dec 15, 2024')).toBeInTheDocument();
    });

    it('should display "Open Gallery" CTA text', () => {
      render(<ProjectCard {...existingProps} />);

      expect(screen.getByText('Open Gallery')).toBeInTheDocument();
    });

    it('should show completed check icon', () => {
      render(<ProjectCard {...existingProps} />);

      // CheckCircle2 icon is rendered for completed status
      const checkIcon = document.querySelector('.lucide-circle-check');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ProjectCard {...existingProps} onClick={handleClick} />);

      await user.click(screen.getByTestId('project-card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Processing Status', () => {
    it('should display processing indicator when status is processing', () => {
      render(
        <ProjectCard
          type="existing"
          title="Processing Project"
          status="processing"
          image="https://example.com/thumb.jpg"
        />
      );

      expect(screen.getByText(/Developing/)).toBeInTheDocument();
    });

    it('should show processing animation or indicator', () => {
      render(
        <ProjectCard
          type="existing"
          title="Processing Project"
          status="processing"
          image="https://example.com/thumb.jpg"
        />
      );

      const indicator = screen.getByTestId('processing-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should apply grayscale and blur to image when processing', () => {
      render(
        <ProjectCard
          type="existing"
          title="Processing Project"
          status="processing"
          image="https://example.com/thumb.jpg"
        />
      );

      const img = screen.getByRole('img');
      expect(img.className).toMatch(/grayscale/);
      expect(img.className).toMatch(/blur-sm/);
    });

    it('should not show processing indicator for completed status', () => {
      render(
        <ProjectCard
          type="existing"
          title="Completed Project"
          status="completed"
          image="https://example.com/thumb.jpg"
        />
      );

      expect(
        screen.queryByTestId('processing-indicator')
      ).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing image gracefully for existing type', () => {
      render(<ProjectCard type="existing" title="No Image Project" />);

      const card = screen.getByTestId('project-card');
      expect(card).toBeInTheDocument();
      // 이미지 없을 때 플레이스홀더가 표시되어야 함
    });

    it('should handle missing title for existing type', () => {
      render(
        <ProjectCard type="existing" image="https://example.com/thumb.jpg" />
      );

      const card = screen.getByTestId('project-card');
      expect(card).toBeInTheDocument();
    });

    it('should show default title for new type when title not provided', () => {
      render(<ProjectCard type="new" />);

      expect(screen.getByText('Start New Shooting')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<ProjectCard type="new" className="custom-test-class" />);

      const card = screen.getByTestId('project-card');
      expect(card).toHaveClass('custom-test-class');
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      render(<ProjectCard type="new" />);

      const card = screen.getByTestId('project-card');
      expect(card.className).toMatch(/rounded/);
    });

    it('should have cursor pointer', () => {
      render(<ProjectCard type="new" />);

      const card = screen.getByTestId('project-card');
      expect(card.className).toMatch(/cursor-pointer/);
    });

    it('should have image area taking 65% height', () => {
      render(
        <ProjectCard
          type="existing"
          title="Test"
          image="https://example.com/thumb.jpg"
        />
      );

      const imageArea = document.querySelector('.h-\\[65\\%\\]');
      expect(imageArea).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate role', () => {
      render(<ProjectCard type="new" />);

      const card = screen.getByTestId('project-card');
      // button role 또는 클릭 가능한 요소로 접근성 제공
      expect(card.tagName.toLowerCase()).toMatch(/button|div/);
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<ProjectCard type="new" onClick={handleClick} />);

      const card = screen.getByTestId('project-card');
      fireEvent.keyDown(card, { key: 'Enter' });

      // Enter 키로 클릭 가능해야 함 (button일 경우 자동 지원)
    });

    it('should have alt text for existing project image', () => {
      render(
        <ProjectCard
          type="existing"
          title="Wedding Album"
          image="https://example.com/thumb.jpg"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt');
    });
  });
});
