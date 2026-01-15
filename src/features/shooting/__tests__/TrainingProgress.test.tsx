import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TrainingProgress } from '../components/TrainingProgress';
import { TRAINING_MESSAGES, TIMING } from '../constants';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('TrainingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('UI Elements', () => {
    it('should display the main microcopy message', () => {
      render(<TrainingProgress status="training" />);

      expect(
        screen.getByText(/작가님이 두 분의 빛을 익히는 중이에요/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/잠시만요/i)).toBeInTheDocument();
    });

    it('should show the first training message initially', () => {
      render(<TrainingProgress status="training" />);

      expect(screen.getByText(TRAINING_MESSAGES[0])).toBeInTheDocument();
    });

    it('should display "앱을 닫아도 괜찮아요" safety message', () => {
      render(<TrainingProgress status="training" />);

      expect(
        screen.getByText(/앱을 닫아도 괜찮아요/i)
      ).toBeInTheDocument();
    });

    it('should render notification toggle component', () => {
      render(<TrainingProgress status="training" />);

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('Rolling Text Animation', () => {
    it('should cycle through training messages', async () => {
      render(<TrainingProgress status="training" />);

      // First message should be visible
      expect(screen.getByText(TRAINING_MESSAGES[0])).toBeInTheDocument();

      // Advance to trigger interval callback
      act(() => {
        vi.advanceTimersByTime(TIMING.messageRotation);
      });

      // Advance past the transition timeout
      act(() => {
        vi.advanceTimersByTime(TIMING.messageTransition + 50);
      });

      expect(screen.getByText(TRAINING_MESSAGES[1])).toBeInTheDocument();
    });

    it('should loop back to first message after last', async () => {
      render(<TrainingProgress status="training" />);

      // Advance through all messages
      for (let i = 0; i < TRAINING_MESSAGES.length; i++) {
        act(() => {
          vi.advanceTimersByTime(TIMING.messageRotation);
        });
        act(() => {
          vi.advanceTimersByTime(TIMING.messageTransition + 50);
        });
      }

      // After cycling through all, it should be back to first
      expect(screen.getByText(TRAINING_MESSAGES[0])).toBeInTheDocument();
    });
  });

  describe('Status Handling', () => {
    it('should render for queued status', () => {
      render(<TrainingProgress status="queued" />);

      expect(
        screen.getByText(/작가님이 두 분의 빛을 익히는 중이에요/i)
      ).toBeInTheDocument();
    });

    it('should render for training status', () => {
      render(<TrainingProgress status="training" />);

      expect(
        screen.getByText(/작가님이 두 분의 빛을 익히는 중이에요/i)
      ).toBeInTheDocument();
    });
  });
});
