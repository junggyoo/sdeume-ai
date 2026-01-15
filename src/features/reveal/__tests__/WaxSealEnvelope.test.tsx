import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WaxSealEnvelope } from '../components/WaxSealEnvelope';
import { REVEAL_TIMING } from '../constants';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onAnimationComplete,
      style,
      initial,
      animate,
      ...props
    }: React.PropsWithChildren<{
      onAnimationComplete?: () => void;
      style?: React.CSSProperties;
      initial?: object;
      animate?: object;
    }>) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
    button: ({
      children,
      style,
      ...props
    }: React.PropsWithChildren<{ style?: React.CSSProperties }>) => (
      <button style={style} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('WaxSealEnvelope', () => {
  const defaultProps = {
    isOpened: false,
    onOpen: vi.fn(),
    onOpenComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render closed envelope with wax seal when isOpened is false', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      expect(screen.getByTestId('wax-seal-envelope')).toBeInTheDocument();
      expect(screen.getByTestId('wax-seal-button')).toBeInTheDocument();
      expect(screen.getByTestId('envelope-body')).toBeInTheDocument();
    });

    it('should have accessible button for seal', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      expect(sealButton).toHaveAttribute('aria-label', '봉투 열기');
      expect(sealButton.tagName).toBe('BUTTON');
    });

    it('should render envelope flap', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      expect(screen.getByTestId('envelope-flap')).toBeInTheDocument();
    });
  });

  describe('Opening Animation', () => {
    it('should call onOpen when seal is clicked', () => {
      const onOpen = vi.fn();
      render(<WaxSealEnvelope {...defaultProps} onOpen={onOpen} />);

      fireEvent.click(screen.getByTestId('wax-seal-button'));

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible (Enter key)', () => {
      const onOpen = vi.fn();
      render(<WaxSealEnvelope {...defaultProps} onOpen={onOpen} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      fireEvent.keyDown(sealButton, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(sealButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(sealButton); // button element responds to Enter with click

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible (Space key)', () => {
      const onOpen = vi.fn();
      render(<WaxSealEnvelope {...defaultProps} onOpen={onOpen} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      fireEvent.keyDown(sealButton, { key: ' ', code: 'Space' });
      fireEvent.keyUp(sealButton, { key: ' ', code: 'Space' });
      fireEvent.click(sealButton); // button element responds to Space with click

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should show opening animation when isOpened becomes true', () => {
      const { rerender } = render(<WaxSealEnvelope {...defaultProps} />);

      // 아직 열리지 않음
      expect(screen.getByTestId('wax-seal-envelope')).toBeInTheDocument();

      // 열림 상태로 변경
      rerender(<WaxSealEnvelope {...defaultProps} isOpened={true} />);

      // 열림 상태에서도 봉투가 보임 (애니메이션 진행 중)
      expect(screen.getByTestId('wax-seal-envelope')).toBeInTheDocument();
    });

    it('should call onOpenComplete after animation finishes', () => {
      const onOpenComplete = vi.fn();
      const { rerender } = render(
        <WaxSealEnvelope {...defaultProps} onOpenComplete={onOpenComplete} />
      );

      // 열림 상태로 변경
      rerender(
        <WaxSealEnvelope
          {...defaultProps}
          isOpened={true}
          onOpenComplete={onOpenComplete}
        />
      );

      // 전체 애니메이션 시간 경과
      const totalDuration =
        REVEAL_TIMING.sealBreak +
        REVEAL_TIMING.envelopeOpen +
        REVEAL_TIMING.lightBloom +
        REVEAL_TIMING.galleryFade;

      act(() => {
        vi.advanceTimersByTime(totalDuration + 100);
      });

      expect(onOpenComplete).toHaveBeenCalledTimes(1);
    });

    it('should not call onOpenComplete before animation finishes', () => {
      const onOpenComplete = vi.fn();
      const { rerender } = render(
        <WaxSealEnvelope {...defaultProps} onOpenComplete={onOpenComplete} />
      );

      rerender(
        <WaxSealEnvelope
          {...defaultProps}
          isOpened={true}
          onOpenComplete={onOpenComplete}
        />
      );

      // 일부만 시간 경과
      act(() => {
        vi.advanceTimersByTime(REVEAL_TIMING.sealBreak - 100);
      });

      expect(onOpenComplete).not.toHaveBeenCalled();
    });
  });

  describe('Visual Elements', () => {
    it('should render light bloom effect when opened', () => {
      render(<WaxSealEnvelope {...defaultProps} isOpened={true} />);

      expect(screen.getByTestId('light-bloom')).toBeInTheDocument();
    });

    it('should not render light bloom when closed', () => {
      render(<WaxSealEnvelope {...defaultProps} isOpened={false} />);

      expect(screen.queryByTestId('light-bloom')).not.toBeInTheDocument();
    });

    it('should apply rose gold color to wax seal', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      // Rose gold 색상 (#B9896E) 적용 확인
      expect(sealButton).toHaveClass('bg-accent-rose');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      expect(sealButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have visible focus indicator', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      const sealButton = screen.getByTestId('wax-seal-button');
      // focus-visible 클래스 포함 확인
      expect(sealButton.className).toContain('focus');
    });

    it('should have descriptive aria-label', () => {
      render(<WaxSealEnvelope {...defaultProps} />);

      expect(screen.getByLabelText('봉투 열기')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<WaxSealEnvelope {...defaultProps} className="custom-envelope" />);

      expect(screen.getByTestId('wax-seal-envelope')).toHaveClass(
        'custom-envelope'
      );
    });
  });

  describe('Disabled State', () => {
    it('should not trigger onOpen when already opened', () => {
      const onOpen = vi.fn();
      render(<WaxSealEnvelope {...defaultProps} isOpened={true} onOpen={onOpen} />);

      // 버튼이 비활성화되어 있거나 클릭해도 onOpen이 호출되지 않아야 함
      const sealButton = screen.queryByTestId('wax-seal-button');
      if (sealButton) {
        fireEvent.click(sealButton);
      }

      expect(onOpen).not.toHaveBeenCalled();
    });
  });
});
