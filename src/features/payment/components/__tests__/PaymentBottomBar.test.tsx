import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentBottomBar } from '../PaymentBottomBar';
import type { Package } from '../../types';

const mockPackage: Package = {
  id: 'pro',
  name: 'Pro',
  nameKr: '프로',
  price: 49900,
  originalPrice: 70000,
  discount: 29,
  themeCount: 2,
  features: [
    { icon: '📸', text: '화보 36장' },
    { icon: '🔄', text: '재촬영 3회' },
  ],
  recommended: true,
};

describe('PaymentBottomBar', () => {
  const defaultProps = {
    selectedPackage: mockPackage,
    onPayment: vi.fn(),
    isProcessing: false,
    canProceed: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('should render package name when package is selected', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      // Both mobile and desktop layouts render, so use getAllBy
      const packageNames = screen.getAllByText(/Pro 패키지/);
      expect(packageNames.length).toBeGreaterThan(0);
      expect(packageNames[0]).toBeInTheDocument();
    });

    it('should render original price with strikethrough', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const originalPrices = screen.getAllByText('70,000원');
      expect(originalPrices.length).toBeGreaterThan(0);
      expect(originalPrices[0]).toHaveClass('line-through');
    });

    it('should render discount percentage', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const discounts = screen.getAllByText(/29%/);
      expect(discounts.length).toBeGreaterThan(0);
      expect(discounts[0]).toBeInTheDocument();
    });

    it('should render final price', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const prices = screen.getAllByText('49,900원');
      expect(prices.length).toBeGreaterThan(0);
      expect(prices[0]).toBeInTheDocument();
    });

    it('should render payment button', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const buttons = screen.getAllByRole('button', { name: /결제하고 촬영 시작/ });
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should not render when no package selected', () => {
      render(<PaymentBottomBar {...defaultProps} selectedPackage={null} />);

      expect(screen.queryByTestId('payment-bottom-bar')).not.toBeInTheDocument();
    });
  });

  describe('상태', () => {
    it('should disable button when canProceed is false', () => {
      render(<PaymentBottomBar {...defaultProps} canProceed={false} />);

      expect(
        screen.getByRole('button', { name: /결제하고 촬영 시작/ })
      ).toBeDisabled();
    });

    it('should show loading state when isProcessing is true', () => {
      render(<PaymentBottomBar {...defaultProps} isProcessing={true} />);

      expect(screen.getByText(/결제 처리 중/)).toBeInTheDocument();
    });

    it('should disable button when isProcessing is true', () => {
      render(<PaymentBottomBar {...defaultProps} isProcessing={true} />);

      expect(screen.getByRole('button', { name: /결제 처리 중/ })).toBeDisabled();
    });

    it('should enable button when canProceed is true', () => {
      render(<PaymentBottomBar {...defaultProps} canProceed={true} />);

      expect(
        screen.getByRole('button', { name: /결제하고 촬영 시작/ })
      ).not.toBeDisabled();
    });
  });

  describe('상호작용', () => {
    it('should call onPayment when button clicked', () => {
      const onPayment = vi.fn();
      render(<PaymentBottomBar {...defaultProps} onPayment={onPayment} />);

      fireEvent.click(
        screen.getByRole('button', { name: /결제하고 촬영 시작/ })
      );

      expect(onPayment).toHaveBeenCalledTimes(1);
    });

    it('should not call onPayment when button is disabled', () => {
      const onPayment = vi.fn();
      render(
        <PaymentBottomBar
          {...defaultProps}
          onPayment={onPayment}
          canProceed={false}
        />
      );

      fireEvent.click(
        screen.getByRole('button', { name: /결제하고 촬영 시작/ })
      );

      expect(onPayment).not.toHaveBeenCalled();
    });
  });

  describe('스타일링', () => {
    it('should have fixed position at bottom', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const bar = screen.getByTestId('payment-bottom-bar');
      expect(bar).toHaveClass('fixed', 'bottom-0');
    });

    it('should have high z-index', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const bar = screen.getByTestId('payment-bottom-bar');
      expect(bar).toHaveClass('z-50');
    });

    it('should have dark background', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const bar = screen.getByTestId('payment-bottom-bar');
      expect(bar).toHaveClass('bg-slate-900/95');
    });

    it('should have top border', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const bar = screen.getByTestId('payment-bottom-bar');
      expect(bar).toHaveClass('border-t');
    });
  });

  describe('접근성', () => {
    it('should have proper button aria-label', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      const button = screen.getByRole('button', { name: /결제하고 촬영 시작/ });
      expect(button).toBeInTheDocument();
    });

    it('should indicate loading state to screen readers', () => {
      render(<PaymentBottomBar {...defaultProps} isProcessing={true} />);

      const button = screen.getByRole('button', { name: /결제 처리 중/ });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('금액 포맷팅', () => {
    it('should format price with comma separator', () => {
      render(<PaymentBottomBar {...defaultProps} />);

      expect(screen.getByText('49,900원')).toBeInTheDocument();
      expect(screen.getByText('70,000원')).toBeInTheDocument();
    });

    it('should handle different package prices', () => {
      const basicPackage: Package = {
        ...mockPackage,
        id: 'basic',
        name: 'Basic',
        price: 29900,
        originalPrice: 40000,
        discount: 25,
      };

      render(
        <PaymentBottomBar {...defaultProps} selectedPackage={basicPackage} />
      );

      expect(screen.getByText('29,900원')).toBeInTheDocument();
      expect(screen.getByText('40,000원')).toBeInTheDocument();
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });
  });
});
