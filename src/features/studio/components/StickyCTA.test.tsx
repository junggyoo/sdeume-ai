import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickyCTA } from './StickyCTA';

describe('StickyCTA', () => {
  describe('basic rendering', () => {
    it('should render next button with default label', () => {
      render(<StickyCTA onNext={() => {}} />);

      expect(
        screen.getByRole('button', { name: /다음으로/ })
      ).toBeInTheDocument();
    });

    it('should render custom next label', () => {
      render(<StickyCTA onNext={() => {}} nextLabel="완료" />);

      expect(screen.getByRole('button', { name: /완료/ })).toBeInTheDocument();
    });

    it('should render back button when showBack is true and onBack provided', () => {
      render(<StickyCTA onNext={() => {}} onBack={() => {}} showBack={true} />);

      expect(screen.getByRole('button', { name: /이전/ })).toBeInTheDocument();
    });

    it('should not render back button when showBack is false', () => {
      render(
        <StickyCTA onNext={() => {}} onBack={() => {}} showBack={false} />
      );

      expect(
        screen.queryByRole('button', { name: /이전/ })
      ).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onNext when next button is clicked', () => {
      const handleNext = vi.fn();
      render(<StickyCTA onNext={handleNext} />);

      const nextButton = screen.getByRole('button', { name: /다음으로/ });
      fireEvent.click(nextButton);

      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when back button is clicked', () => {
      const handleBack = vi.fn();
      render(<StickyCTA onNext={() => {}} onBack={handleBack} />);

      const backButton = screen.getByRole('button', { name: /이전/ });
      fireEvent.click(backButton);

      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    it('should disable next button when isNextDisabled is true', () => {
      render(<StickyCTA onNext={() => {}} isNextDisabled={true} />);

      const nextButton = screen.getByRole('button', { name: /다음으로/ });
      expect(nextButton).toBeDisabled();
    });

    it('should disable back button when isBackDisabled is true', () => {
      render(
        <StickyCTA onNext={() => {}} onBack={() => {}} isBackDisabled={true} />
      );

      const backButton = screen.getByRole('button', { name: /이전/ });
      expect(backButton).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<StickyCTA onNext={() => {}} isLoading={true} />);

      expect(screen.getByText(/처리 중/)).toBeInTheDocument();
    });

    it('should disable buttons when isLoading is true', () => {
      render(
        <StickyCTA onNext={() => {}} onBack={() => {}} isLoading={true} />
      );

      const nextButton = screen.getByRole('button', { name: /처리 중/ });
      const backButton = screen.getByRole('button', { name: /이전/ });

      expect(nextButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });
  });

  describe('dark variant', () => {
    it('should have dark background when variant is dark', () => {
      render(<StickyCTA onNext={() => {}} variant="dark" />);

      const container = screen.getByTestId('sticky-cta');
      expect(container).toHaveClass('bg-slate-900/95');
    });

    it('should have violet button when variant is dark', () => {
      render(<StickyCTA onNext={() => {}} variant="dark" />);

      const nextButton = screen.getByRole('button', { name: /다음으로/ });
      expect(nextButton).toHaveClass('bg-violet-600');
    });
  });

  describe('selected theme display', () => {
    const selectedTheme = {
      name: '가든 스튜디오',
      bgColor: 'bg-gradient-to-br from-emerald-300 via-green-200 to-lime-100',
    };

    it('should display selected theme info when provided', () => {
      render(
        <StickyCTA
          onNext={() => {}}
          variant="dark"
          selectedTheme={selectedTheme}
        />
      );

      expect(screen.getByText('선택한 컨셉')).toBeInTheDocument();
      expect(screen.getByText('가든 스튜디오')).toBeInTheDocument();
    });

    it('should display theme thumbnail with gradient background', () => {
      render(
        <StickyCTA
          onNext={() => {}}
          variant="dark"
          selectedTheme={selectedTheme}
        />
      );

      const thumbnail = screen.getByTestId('theme-thumbnail');
      expect(thumbnail).toHaveClass('bg-gradient-to-br');
    });

    it('should not display selected theme info when not provided', () => {
      render(<StickyCTA onNext={() => {}} variant="dark" />);

      expect(screen.queryByText('선택한 컨셉')).not.toBeInTheDocument();
    });

    it('should only show selected theme in dark variant', () => {
      render(
        <StickyCTA
          onNext={() => {}}
          variant="light"
          selectedTheme={selectedTheme}
        />
      );

      // Light variant should not display selectedTheme
      expect(screen.queryByText('선택한 컨셉')).not.toBeInTheDocument();
    });
  });

  describe('progress info', () => {
    const progress = {
      brideCount: 5,
      groomCount: 3,
      maxPhotos: 10,
    };

    it('should display progress info when provided in dark variant', () => {
      render(
        <StickyCTA onNext={() => {}} variant="dark" progress={progress} />
      );

      expect(screen.getByText(/신부/)).toBeInTheDocument();
      expect(screen.getByText(/신랑/)).toBeInTheDocument();
    });
  });
});
