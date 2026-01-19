import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SimpleHeader } from './SimpleHeader';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

describe('SimpleHeader', () => {
  describe('Step Indicator Dots', () => {
    /**
     * Requirements:
     * - Dots should have 2 states: active (white) and inactive (slate-700)
     * - Current step and all previous steps should be active
     * - Future steps should be inactive
     * - Always render 5 dots
     */

    it('should render 5 dots for all steps', () => {
      mockUsePathname.mockReturnValue('/new-shoot/step1');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/); // All dots have title attribute
      expect(dots).toHaveLength(5);
    });

    it('should show only first dot as active on step 1', () => {
      mockUsePathname.mockReturnValue('/new-shoot/step1');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // First dot should be white (active)
      expect(dots[0]).toHaveClass('bg-white');

      // Remaining dots should be inactive (slate-700)
      expect(dots[1]).toHaveClass('bg-slate-700');
      expect(dots[2]).toHaveClass('bg-slate-700');
      expect(dots[3]).toHaveClass('bg-slate-700');
      expect(dots[4]).toHaveClass('bg-slate-700');
    });

    it('should show first two dots as active on step 2', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/step2');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // First two dots should be white (active)
      expect(dots[0]).toHaveClass('bg-white');
      expect(dots[1]).toHaveClass('bg-white');

      // Remaining dots should be inactive
      expect(dots[2]).toHaveClass('bg-slate-700');
      expect(dots[3]).toHaveClass('bg-slate-700');
      expect(dots[4]).toHaveClass('bg-slate-700');
    });

    it('should show first three dots as active on step 3', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/step3');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // First three dots should be white (active)
      expect(dots[0]).toHaveClass('bg-white');
      expect(dots[1]).toHaveClass('bg-white');
      expect(dots[2]).toHaveClass('bg-white');

      // Remaining dots should be inactive
      expect(dots[3]).toHaveClass('bg-slate-700');
      expect(dots[4]).toHaveClass('bg-slate-700');
    });

    it('should show first four dots as active on progress step', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/progress');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // First four dots should be white (active)
      expect(dots[0]).toHaveClass('bg-white');
      expect(dots[1]).toHaveClass('bg-white');
      expect(dots[2]).toHaveClass('bg-white');
      expect(dots[3]).toHaveClass('bg-white');

      // Last dot should be inactive
      expect(dots[4]).toHaveClass('bg-slate-700');
    });

    it('should show all dots as active on results step', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/results');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // All dots should be white (active)
      expect(dots[0]).toHaveClass('bg-white');
      expect(dots[1]).toHaveClass('bg-white');
      expect(dots[2]).toHaveClass('bg-white');
      expect(dots[3]).toHaveClass('bg-white');
      expect(dots[4]).toHaveClass('bg-white');
    });

    it('should not use bg-primary-mobile or bg-white/30 classes (old 3-state logic)', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/step3');

      render(<SimpleHeader />);

      const dots = screen.getAllByTitle(/.+/);

      // Verify old classes are not used
      dots.forEach((dot) => {
        expect(dot).not.toHaveClass('bg-primary-mobile');
        expect(dot).not.toHaveClass('bg-white/30');
      });
    });
  });

  describe('Step Counter Display', () => {
    it('should display correct step counter text for step 1', () => {
      mockUsePathname.mockReturnValue('/new-shoot/step1');

      render(<SimpleHeader />);

      expect(screen.getByText('STEP 1 OF 5')).toBeInTheDocument();
    });

    it('should display correct step counter text for step 2', () => {
      mockUsePathname.mockReturnValue('/new-shoot/abc123/step2');

      render(<SimpleHeader />);

      expect(screen.getByText('STEP 2 OF 5')).toBeInTheDocument();
    });
  });
});
