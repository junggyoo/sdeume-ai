import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import GeneratingStage from '../GeneratingStage';

// Filter out framer-motion specific props
const filterMotionProps = (props: Record<string, unknown>) => {
  const motionProps = [
    'layout',
    'layoutScroll',
    'initial',
    'animate',
    'exit',
    'transition',
    'whileHover',
    'whileTap',
    'whileFocus',
    'whileDrag',
    'variants',
    'layoutId',
  ];
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!motionProps.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...filterMotionProps(props)}>{children}</div>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...filterMotionProps(props)}>{children}</button>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & Record<string, unknown>) => (
      <p {...filterMotionProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (value: unknown) => value,
}));

describe('GeneratingStage', () => {
  const mockOnFinish = vi.fn();
  const mockThemeImage = '/test-theme-image.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase 1: Face Training (얼굴 학습)', () => {
    it('should render training phase initially with Korean text', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('얼굴 분석 중')).toBeInTheDocument();
      expect(screen.getByText('얼굴을 학습하고 있어요...')).toBeInTheDocument();
    });

    it('should display scanning badge with Korean text', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('얼굴 분석 중')).toBeInTheDocument();
    });

    it('should show progress percentage starting at 0%', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should render theme image in training card', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const image = screen.getByRole('img', { name: 'Theme' });
      expect(image).toHaveAttribute('src', mockThemeImage);
    });

    it('should show scanning animation element', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Scanning line should be present (purple bar)
      const scanningLine = document.querySelector('.bg-purple-500');
      expect(scanningLine).toBeInTheDocument();
    });

    it('should display notification toggle during training phase with Korean text', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Both desktop and mobile toggles exist
      const notifyTexts = screen.getAllByText('완료 시 알림 받기');
      expect(notifyTexts.length).toBeGreaterThan(0);
      expect(screen.getByText(/푸시 알림을 보내드릴게요/)).toBeInTheDocument();
    });

    it('should toggle notification when clicked', async () => {
      const user = userEvent.setup();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Use getAllByText since both desktop and mobile have the same text
      const notifyTexts = screen.getAllByText('완료 시 알림 받기');
      // Find the mobile toggle (the one with cursor-pointer parent that has text-sm)
      const mobileToggle = notifyTexts.find((el) => el.classList.contains('text-sm'));
      const notifyToggle = mobileToggle?.closest('div[class*="cursor-pointer"]');
      expect(notifyToggle).toBeInTheDocument();

      await user.click(notifyToggle!);

      // Toggle should have changed state (purple background on bell icon container)
      const bellContainer = notifyToggle?.querySelector('[class*="bg-purple-100"]');
      expect(bellContainer).toBeInTheDocument();
    });

    it('should increment training progress over time', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('0%')).toBeInTheDocument();

      // Advance timer to allow progress (0.4% per 30ms = ~1.3% after 100ms)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Progress should have increased
      const progressText = screen.getByText(/\d+%/);
      const progressValue = parseInt(progressText.textContent || '0');
      expect(progressValue).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should not display estimated time during training phase', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Training phase doesn't show time estimate - only generating phase does
      expect(screen.queryByText(/약.*분/)).not.toBeInTheDocument();
    });
  });

  describe('Phase Transition', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should transition from training to generating phase when training completes', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Training takes about 7500ms (100% / 0.4% * 30ms)
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });

      expect(screen.getByText('화보 현상 중 1')).toBeInTheDocument();
    });
  });

  describe('Phase 2: Image Generation (화보 현상)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function advanceToGeneratingPhase() {
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
    }

    it('should display generating phase UI with Korean text after training', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      expect(screen.getByText('1번째 화보를 현상하고 있어요...')).toBeInTheDocument();
    });

    it('should show current photo number being generated in Korean', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      expect(screen.getByText('화보 현상 중 1')).toBeInTheDocument();
    });

    it('should display estimated time during generating phase', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Should show static time estimate during generating phase
      expect(screen.getByText('약 10분 소요')).toBeInTheDocument();
    });

    it('should show generation progress percentage', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      const progressText = screen.getByText(/\d+%/);
      expect(progressText).toBeInTheDocument();
    });

    it('should show film strip with Korean counter after first photo completes', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete first photo (100% / 2% * 20ms = 1000ms)
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText('현상된 필름 • 1 / 4')).toBeInTheDocument();
    });

    it('should increment photo count in film strip as photos complete', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete 3 photos
      await act(async () => {
        vi.advanceTimersByTime(3600);
      });

      expect(screen.getByText(/[3-4] \/ 4/)).toBeInTheDocument();
    });

    it('should update photo number badge as generation progresses', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete first photo
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText('화보 현상 중 2')).toBeInTheDocument();
    });
  });

  describe('Phase 3: Complete (완료)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function advanceToCompletePhase() {
      // Training: ~8000ms
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
      // Generation: 4 photos * ~1100ms each = ~4400ms (with buffer)
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }
    }

    it('should display complete state with Korean text after all photos generated', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText('컬렉션 완성!')).toBeInTheDocument();
    });

    it('should show reveal button with Korean text in complete phase', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByRole('button', { name: /앨범 열기/ })).toBeInTheDocument();
    });

    it('should display photo count on reveal button in Korean format', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText(/앨범 열기 \(4장\)/)).toBeInTheDocument();
    });

    it('should call onFinish when reveal button is clicked', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      const revealButton = screen.getByRole('button', { name: /앨범 열기/ });

      // Use fireEvent instead of userEvent to avoid fake timer conflicts
      await act(async () => {
        revealButton.click();
      });

      expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });

    it('should show completion message in Korean in subtitle', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText('4장의 아름다운 화보가 완성되었어요')).toBeInTheDocument();
    });

    it('should show complete badge with Korean text', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText('촬영 완료')).toBeInTheDocument();
    });
  });

  describe('Rotating Tips (롤링 메시지)', () => {
    it('should display initial Korean tip', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('얼굴 특징을 분석하고 있어요...')).toBeInTheDocument();
    });

    it('should rotate tips every 4 seconds', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('얼굴 특징을 분석하고 있어요...')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByText('빛의 각도를 연구하고 있어요...')).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('should cycle through multiple Korean tips during training', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // First tip should be visible
      expect(screen.getByText('얼굴 특징을 분석하고 있어요...')).toBeInTheDocument();

      // After 4 seconds (within training phase), second tip should show
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText('빛의 각도를 연구하고 있어요...')).toBeInTheDocument();

      // Verify we're still in training phase
      expect(screen.getByText('얼굴 분석 중')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Film Strip (현상된 필름)', () => {
    it('should not show film strip counter during training phase', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.queryByText(/현상된 필름/)).not.toBeInTheDocument();
    });

    it('should show film strip counter only after photos start completing', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Advance to generating phase
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });

      // Before any photo completes - counter not visible
      expect(screen.queryByText(/현상된 필름/)).not.toBeInTheDocument();

      // After first photo completes
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText(/현상된 필름 • 1 \/ 4/)).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('should display photo thumbnails in film strip', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Advance to generating phase
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });

      // Complete 2 photos
      await act(async () => {
        vi.advanceTimersByTime(2400);
      });

      const filmStrip = document.querySelector('.bg-black\\/80');
      const thumbnails = filmStrip?.querySelectorAll('img');
      expect(thumbnails?.length).toBeGreaterThanOrEqual(1);
      vi.useRealTimers();
    });

    it('should show photo number on each thumbnail', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Advance to generating phase
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });

      // Complete first photo
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText('#1')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('Styling', () => {
    it('should apply grayscale filter to training image', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const image = screen.getByRole('img', { name: 'Theme' });
      expect(image).toHaveClass('grayscale');
    });

    it('should have proper container background', () => {
      const { container } = render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('bg-[#FAFAFA]');
    });

    it('should display cards with rounded corners and shadow', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const card = document.querySelector('.rounded-\\[32px\\]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('shadow-2xl');
    });

    it('should have purple badge styling', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const badge = screen.getByText('얼굴 분석 중').closest('div');
      expect(badge).toHaveClass('bg-purple-50');
      expect(badge).toHaveClass('text-purple-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button in complete phase', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Advance to complete phase: training + all 4 photos
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }

      const button = screen.getByRole('button', { name: /앨범 열기/ });
      expect(button).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('Props', () => {
    it('should use provided themeImage for all image elements', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('src', mockThemeImage);
      });
    });

    it('should not call onFinish until reveal button is clicked', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Go through entire generation process: training + all 4 photos
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }

      // onFinish should not be called automatically
      expect(mockOnFinish).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Visual Enhancements', () => {
    it('should have pulsing scan icon on training card', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Check for pulsing scan face icon
      const pulsingIcon = document.querySelector('.animate-pulse');
      expect(pulsingIcon).toBeInTheDocument();
    });

    it('should have scanning line on training card', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Check for purple scanning line
      const scanningLine = document.querySelector('.bg-purple-500');
      expect(scanningLine).toBeInTheDocument();
    });
  });
});
