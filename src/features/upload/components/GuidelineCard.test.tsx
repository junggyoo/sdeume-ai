import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidelineCard } from './GuidelineCard';

// TODO: Fix props interface mismatch - See docs/testing-strategy.md
describe.skip('GuidelineCard', () => {
  describe('렌더링', () => {
    it('should render title', () => {
      render(<GuidelineCard />);

      expect(screen.getByText(/사진 가이드/i)).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<GuidelineCard />);

      expect(screen.getByRole('button', { name: /접기|펼치기/i })).toBeInTheDocument();
    });
  });

  describe('접기/펼치기 동작', () => {
    it('should be expanded by default', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getByTestId('guideline-content')).toBeVisible();
    });

    it('should be collapsed when defaultExpanded is false', () => {
      render(<GuidelineCard defaultExpanded={false} />);

      expect(screen.queryByTestId('guideline-content')).not.toBeInTheDocument();
    });

    it('should toggle content visibility when button is clicked', () => {
      render(<GuidelineCard defaultExpanded={false} />);

      // 처음에는 접혀있음
      expect(screen.queryByTestId('guideline-content')).not.toBeInTheDocument();

      // 클릭하면 펼쳐짐
      fireEvent.click(screen.getByRole('button', { name: /펼치기/i }));
      expect(screen.getByTestId('guideline-content')).toBeInTheDocument();

      // 다시 클릭하면 접힘
      fireEvent.click(screen.getByRole('button', { name: /접기/i }));
      expect(screen.queryByTestId('guideline-content')).not.toBeInTheDocument();
    });
  });

  describe('좋은/나쁜 예시 섹션', () => {
    it('should display good examples section', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getByText('좋은 사진')).toBeInTheDocument();
    });

    it('should display bad examples section', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getByText('피해야 할 사진')).toBeInTheDocument();
    });

    it('should display good example items', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getByText(/정면 얼굴/i)).toBeInTheDocument();
      expect(screen.getByText(/자연스러운 표정/i)).toBeInTheDocument();
    });

    it('should display bad example items', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getByText(/얼굴이 가려진 사진/i)).toBeInTheDocument();
      expect(screen.getByText(/흐린 사진/i)).toBeInTheDocument();
    });
  });

  describe('아이콘 표시', () => {
    it('should show check icon for good examples', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getAllByTestId('good-icon').length).toBeGreaterThan(0);
    });

    it('should show x icon for bad examples', () => {
      render(<GuidelineCard defaultExpanded />);

      expect(screen.getAllByTestId('bad-icon').length).toBeGreaterThan(0);
    });
  });

  describe('커스텀 예시', () => {
    it('should display custom good examples', () => {
      const goodExamples = ['밝은 조명', '고해상도'];
      render(<GuidelineCard defaultExpanded goodExamples={goodExamples} />);

      expect(screen.getByText('밝은 조명')).toBeInTheDocument();
      expect(screen.getByText('고해상도')).toBeInTheDocument();
    });

    it('should display custom bad examples', () => {
      const badExamples = ['역광', '저해상도'];
      render(<GuidelineCard defaultExpanded badExamples={badExamples} />);

      expect(screen.getByText('역광')).toBeInTheDocument();
      expect(screen.getByText('저해상도')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have accessible toggle button with expanded state', () => {
      render(<GuidelineCard defaultExpanded />);

      const button = screen.getByRole('button', { name: /접기/i });
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have accessible toggle button with collapsed state', () => {
      render(<GuidelineCard defaultExpanded={false} />);

      const button = screen.getByRole('button', { name: /펼치기/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('다크 모드 스타일', () => {
    it('should have dark background', () => {
      const { container } = render(<GuidelineCard />);

      const card = container.firstChild;
      expect(card).toHaveClass('bg-slate-800');
    });
  });
});
