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
}));

describe('GeneratingStage', () => {
  const mockOnFinish = vi.fn();
  const mockThemeImage = '/test-theme-image.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase 1: Face Training', () => {
    it('should render training phase initially', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('Face Learning')).toBeInTheDocument();
      expect(screen.getByText('Studying your features...')).toBeInTheDocument();
    });

    it('should display scanning badge with Face Learning text', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('Face Learning')).toBeInTheDocument();
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

    it('should display notification toggle during training phase', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('Get notified when ready')).toBeInTheDocument();
      expect(screen.getByText(/We.ll send a push notification/)).toBeInTheDocument();
    });

    it('should toggle notification when clicked', async () => {
      const user = userEvent.setup();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const notifyToggle = screen.getByText('Get notified when ready').closest('div[class*="cursor-pointer"]');
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

      expect(screen.getByText('Developing Photo 1')).toBeInTheDocument();
    });
  });

  describe('Phase 2: Image Generation', () => {
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

    it('should display generating phase UI after training', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      expect(screen.getByText('Developing your masterpiece...')).toBeInTheDocument();
    });

    it('should show current photo number being generated', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      expect(screen.getByText('Developing Photo 1')).toBeInTheDocument();
    });

    it('should display approximate time remaining', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      expect(screen.getByText('Approx. 10 Mins')).toBeInTheDocument();
    });

    it('should show generation progress percentage', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      const progressText = screen.getByText(/\d+%/);
      expect(progressText).toBeInTheDocument();
    });

    it('should show film strip after first photo completes', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete first photo (100% / 2% * 20ms = 1000ms)
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText('Developed Reel • 1 / 12')).toBeInTheDocument();
    });

    it('should increment photo count in film strip as photos complete', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete 3 photos
      await act(async () => {
        vi.advanceTimersByTime(3600);
      });

      expect(screen.getByText(/Developed Reel • [3-4] \/ 12/)).toBeInTheDocument();
    });

    it('should update photo number badge as generation progresses', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToGeneratingPhase();

      // Complete first photo
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText('Developing Photo 2')).toBeInTheDocument();
    });
  });

  describe('Phase 3: Complete', () => {
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
      // Generation: 12 photos * ~1100ms each = ~13200ms (with buffer)
      for (let i = 0; i < 12; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }
    }

    it('should display complete state after all photos generated', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText('Collection Ready.')).toBeInTheDocument();
    });

    it('should show reveal button in complete phase', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByRole('button', { name: /Reveal Album/ })).toBeInTheDocument();
    });

    it('should display photo count on reveal button', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText(/Reveal Album \(12\)/)).toBeInTheDocument();
    });

    it('should call onFinish when reveal button is clicked', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      const revealButton = screen.getByRole('button', { name: /Reveal Album/ });

      // Use fireEvent instead of userEvent to avoid fake timer conflicts
      await act(async () => {
        revealButton.click();
      });

      expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });

    it('should show completion message in subtitle', async () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);
      await advanceToCompletePhase();

      expect(screen.getByText('12 Masterpieces developed.')).toBeInTheDocument();
    });
  });

  describe('Rotating Tips', () => {
    it('should display initial tip', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('Calculating the perfect lighting angles...')).toBeInTheDocument();
    });

    it('should rotate tips every 4 seconds', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.getByText('Calculating the perfect lighting angles...')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByText('Enhancing skin textures and details...')).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('should cycle through all tips', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      const tips = [
        'Calculating the perfect lighting angles...',
        'Enhancing skin textures and details...',
        'Applying professional color grading...',
        'Rendering the final composition...',
      ];

      for (let i = 0; i < tips.length; i++) {
        expect(screen.getByText(tips[i])).toBeInTheDocument();
        await act(async () => {
          vi.advanceTimersByTime(4000);
        });
      }

      // Should cycle back to first tip
      expect(screen.getByText(tips[0])).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('Film Strip', () => {
    it('should not show film strip during training phase', () => {
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      expect(screen.queryByText(/Developed Reel/)).not.toBeInTheDocument();
    });

    it('should show film strip only after photos start completing', async () => {
      vi.useFakeTimers();
      render(<GeneratingStage themeImage={mockThemeImage} onFinish={mockOnFinish} />);

      // Advance to generating phase
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });

      // Before any photo completes
      expect(screen.queryByText(/Developed Reel/)).not.toBeInTheDocument();

      // After first photo completes
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText(/Developed Reel/)).toBeInTheDocument();
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

      // Advance to complete phase: training + all 12 photos
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
      for (let i = 0; i < 12; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }

      const button = screen.getByRole('button', { name: /Reveal Album/ });
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

      // Go through entire generation process: training + all 12 photos
      await act(async () => {
        vi.advanceTimersByTime(8000);
      });
      for (let i = 0; i < 12; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1100);
        });
      }

      // onFinish should not be called automatically
      expect(mockOnFinish).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
