import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverallProgress } from './OverallProgress';

describe('OverallProgress', () => {
  const defaultProps = {
    groomCount: 10,
    brideCount: 12,
  };

  describe('렌더링', () => {
    it('should render both role sections', () => {
      render(<OverallProgress {...defaultProps} />);

      expect(screen.getByText('신부')).toBeInTheDocument();
      expect(screen.getByText('신랑')).toBeInTheDocument();
    });

    it('should display counts for each role', () => {
      render(<OverallProgress {...defaultProps} groomCount={10} brideCount={12} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display emojis for each role', () => {
      render(<OverallProgress {...defaultProps} />);

      expect(screen.getByText('👰')).toBeInTheDocument();
      expect(screen.getByText('🤵')).toBeInTheDocument();
    });
  });

  describe('진행률 표시', () => {
    it('should show progress bars for each role', () => {
      render(<OverallProgress {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);
    });

    it('should calculate progress based on recommended value', () => {
      render(<OverallProgress {...defaultProps} groomCount={10} recommendedPerRole={20} />);

      const groomProgress = screen.getAllByRole('progressbar')[1]; // groom is second
      expect(groomProgress).toHaveAttribute('aria-valuenow', '10');
      expect(groomProgress).toHaveAttribute('aria-valuemax', '20');
    });
  });

  describe('상태 표시', () => {
    it('should show incomplete status when below minimum', () => {
      render(
        <OverallProgress groomCount={20} brideCount={10} minPerRole={15} recommendedPerRole={20} />
      );

      // bride는 10, min은 15 → 5장 더 필요
      expect(screen.getByText(/5장 더 필요/i)).toBeInTheDocument();
    });

    it('should show complete status when at or above recommended', () => {
      render(
        <OverallProgress
          brideCount={20}
          groomCount={20}
          recommendedPerRole={20}
        />
      );

      expect(screen.getAllByText(/충분해요/i)).toHaveLength(2);
    });

    it('should show partial status when between min and recommended', () => {
      render(
        <OverallProgress
          brideCount={17}
          groomCount={20}
          minPerRole={15}
          recommendedPerRole={20}
        />
      );

      // bride는 17, recommended 20 → 3장 더 추가하면 완벽
      expect(screen.getByText(/3장 더 추가하면/i)).toBeInTheDocument();
    });
  });

  describe('전체 완료 상태', () => {
    it('should highlight when both roles are complete', () => {
      const { container } = render(
        <OverallProgress
          {...defaultProps}
          brideCount={20}
          groomCount={20}
          recommendedPerRole={20}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('border-emerald-500/30');
    });

    it('should not highlight when only one role is complete', () => {
      const { container } = render(
        <OverallProgress
          {...defaultProps}
          brideCount={20}
          groomCount={10}
          recommendedPerRole={20}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass('border-emerald-500/30');
    });
  });

  describe('기본값', () => {
    it('should use default minPerRole of 15', () => {
      // brideCount=10, groomCount=20 → bride만 5장 더 필요
      render(<OverallProgress brideCount={10} groomCount={20} />);

      expect(screen.getByText(/5장 더 필요/i)).toBeInTheDocument();
    });

    it('should use default recommendedPerRole of 20', () => {
      // brideCount=17, groomCount=20 → bride만 3장 더 추가하면 완벽
      render(<OverallProgress brideCount={17} groomCount={20} />);

      expect(screen.getByText(/3장 더 추가하면/i)).toBeInTheDocument();
    });
  });

  describe('2열 레이아웃', () => {
    it('should have 2 column grid layout', () => {
      const { container } = render(<OverallProgress {...defaultProps} />);

      const grid = container.querySelector('[data-testid="progress-grid"]');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });

  describe('접근성', () => {
    it('should have accessible labels for progress bars', () => {
      render(<OverallProgress {...defaultProps} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars[0]).toHaveAttribute('aria-label', '신부 진행률');
      expect(progressBars[1]).toHaveAttribute('aria-label', '신랑 진행률');
    });
  });

  describe('다크 모드', () => {
    it('should have dark background', () => {
      const { container } = render(<OverallProgress {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-slate-800');
    });
  });
});
