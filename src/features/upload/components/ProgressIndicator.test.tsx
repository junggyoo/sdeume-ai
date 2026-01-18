import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  describe('기본 렌더링', () => {
    it('should render progress bar', () => {
      render(<ProgressIndicator current={10} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display current count', () => {
      render(<ProgressIndicator current={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display label when provided', () => {
      render(<ProgressIndicator current={10} label="신부" />);

      expect(screen.getByText('신부')).toBeInTheDocument();
    });
  });

  describe('진행률 계산', () => {
    it('should show correct percentage based on recommended value', () => {
      render(<ProgressIndicator current={10} recommended={20} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '10');
      expect(progressbar).toHaveAttribute('aria-valuemax', '20');
    });

    it('should cap progress at 100% when current exceeds recommended', () => {
      const { container } = render(<ProgressIndicator current={25} recommended={20} />);

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveStyle({ width: '100%' });
    });
  });

  describe('마커 표시', () => {
    it('should show minimum marker at correct position', () => {
      render(<ProgressIndicator current={5} min={15} recommended={20} />);

      expect(screen.getByTestId('min-marker')).toBeInTheDocument();
    });

    it('should show recommended marker', () => {
      render(<ProgressIndicator current={5} min={15} recommended={20} />);

      expect(screen.getByTestId('recommended-marker')).toBeInTheDocument();
    });

    it('should display min value on marker', () => {
      render(<ProgressIndicator current={5} min={15} recommended={20} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display recommended value on marker', () => {
      render(<ProgressIndicator current={5} min={15} recommended={20} />);

      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  describe('색상 변화', () => {
    it('should have violet color when below minimum', () => {
      const { container } = render(
        <ProgressIndicator current={10} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-violet-500');
    });

    it('should have amber color when at or above minimum but below recommended', () => {
      const { container } = render(
        <ProgressIndicator current={17} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-amber-500');
    });

    it('should have emerald color when at or above recommended', () => {
      const { container } = render(
        <ProgressIndicator current={20} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-emerald-500');
    });

    it('should have emerald color when above recommended', () => {
      const { container } = render(
        <ProgressIndicator current={25} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-emerald-500');
    });
  });

  describe('기본값', () => {
    it('should use default min of 15', () => {
      render(<ProgressIndicator current={10} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should use default recommended of 20', () => {
      render(<ProgressIndicator current={10} />);

      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have proper ARIA attributes', () => {
      render(<ProgressIndicator current={10} min={15} recommended={20} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '10');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '20');
    });

    it('should have accessible label', () => {
      render(<ProgressIndicator current={10} label="신부 사진" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', '신부 사진 진행률');
    });
  });

  describe('경계값 테스트', () => {
    it('should handle zero current', () => {
      render(<ProgressIndicator current={0} min={15} recommended={20} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle current equal to min', () => {
      const { container } = render(
        <ProgressIndicator current={15} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-amber-500');
    });

    it('should handle current equal to recommended', () => {
      const { container } = render(
        <ProgressIndicator current={20} min={15} recommended={20} />
      );

      const fill = container.querySelector('[data-testid="progress-fill"]');
      expect(fill).toHaveClass('bg-emerald-500');
    });
  });
});
