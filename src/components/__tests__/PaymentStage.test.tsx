import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentStage from '../PaymentStage';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
}));

describe('PaymentStage', () => {
  const mockOnBack = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main title in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('나만의 패키지를');
      expect(title).toHaveTextContent('선택해주세요');
    });

    it('should render subtitle text in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('소중한 순간을 담을 완벽한 패키지를 선택하세요.')).toBeInTheDocument();
    });

    it('should render all 3 plan cards', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByTestId('plan-card-basic')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-pro')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-max')).toBeInTheDocument();
    });

    it('should render plan names', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('Basic')).toBeInTheDocument();
      // Signature appears in both card and footer
      expect(screen.getAllByText(/Signature/).length).toBeGreaterThan(0);
      expect(screen.getByText('Masterpiece')).toBeInTheDocument();
    });

    it('should render prices with comma formatting', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      // Use getAllByText since prices may appear in multiple places
      expect(screen.getAllByText(/19,900/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/49,000/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/99,000/).length).toBeGreaterThan(0);
    });

    it('should render "Most Loved" badge on Signature plan', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('Most Loved')).toBeInTheDocument();
    });

    it('should render save badges on pro and max plans', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('SAVE 33%')).toBeInTheDocument();
      expect(screen.getByText('SAVE 40%')).toBeInTheDocument();
    });

    it('should render strikethrough original prices', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      // Original prices should be displayed with line-through
      const originalPrices = screen.getAllByText(/29,900|69,000|149,000/);
      expect(originalPrices.length).toBeGreaterThan(0);
    });

    it('should render all payment methods in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('신용카드')).toBeInTheDocument();
      expect(screen.getByText('카카오페이')).toBeInTheDocument();
      expect(screen.getByText('토스')).toBeInTheDocument();
      expect(screen.getByText('네이버페이')).toBeInTheDocument();
    });

    it('should render refund guarantee section in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('안 닮으면 100% 환불')).toBeInTheDocument();
    });

    it('should render sticky footer with CTA button in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const footer = screen.getByTestId('payment-footer');
      expect(footer).toBeInTheDocument();

      // Check for Korean CTA button
      expect(screen.getByText('결제하고 시작하기')).toBeInTheDocument();
    });

    it('should render back button in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /이전 단계로/ });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Default State', () => {
    it('should have Signature (pro) plan selected by default', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const proCard = screen.getByTestId('plan-card-pro');
      expect(proCard).toHaveAttribute('aria-selected', 'true');
    });

    it('should have Credit Card selected as default payment method', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const creditCard = screen.getByTestId('payment-method-card');
      expect(creditCard).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Interactions', () => {
    it('should change selected plan when clicking a different plan card', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const basicCard = screen.getByTestId('plan-card-basic');
      fireEvent.click(basicCard);

      expect(basicCard).toHaveAttribute('aria-selected', 'true');

      const proCard = screen.getByTestId('plan-card-pro');
      expect(proCard).toHaveAttribute('aria-selected', 'false');
    });

    it('should change selected payment method when clicking', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const tossPay = screen.getByTestId('payment-method-toss');
      fireEvent.click(tossPay);

      expect(tossPay).toHaveAttribute('aria-selected', 'true');

      const creditCard = screen.getByTestId('payment-method-card');
      expect(creditCard).toHaveAttribute('aria-selected', 'false');
    });

    it('should call onNext when CTA button is clicked', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const ctaButton = screen.getByText('결제하고 시작하기').closest('button')!;
      fireEvent.click(ctaButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when back button is clicked', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /이전 단계로/ });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply glass panel styling to selected plan card', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const planCard = screen.getByTestId('plan-card-pro');
      expect(planCard).toHaveClass('backdrop-blur-xl');
      expect(planCard).toHaveClass('border-purple-400');
    });

    it('should apply dark background to selected payment method', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const creditCard = screen.getByTestId('payment-method-card');
      expect(creditCard).toHaveClass('bg-[#191F28]');
    });

    it('should have sticky footer with glass morphism', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const footer = screen.getByTestId('payment-footer');
      expect(footer).toHaveClass('backdrop-blur-xl');
      expect(footer).toHaveClass('fixed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles on plan cards', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const planCards = screen.getAllByRole('button', { name: /Basic|Signature|Masterpiece/i });
      expect(planCards).toHaveLength(3);
    });

    it('should have aria-selected attribute on plan cards', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const selectedCard = screen.getByTestId('plan-card-pro');
      expect(selectedCard).toHaveAttribute('aria-selected', 'true');

      const unselectedCard = screen.getByTestId('plan-card-basic');
      expect(unselectedCard).toHaveAttribute('aria-selected', 'false');
    });

    it('should have proper heading hierarchy', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
    });
  });

  describe('Price Formatting', () => {
    it('should display prices with Korean won symbol', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      // Check prices appear with ₩ symbol
      expect(screen.getAllByText(/₩/).length).toBeGreaterThan(0);
    });

    it('should show original price with line-through styling', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const originalPrices = screen.getAllByText(/29,900/);
      originalPrices.forEach((price) => {
        expect(price).toHaveClass('line-through');
      });
    });
  });

  describe('Sticky Footer', () => {
    it('should display selected plan summary in footer', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      // Default is Signature with Korean suffix
      expect(screen.getByTestId('footer-plan-name')).toHaveTextContent('Signature 패키지');
      expect(screen.getByTestId('footer-plan-price')).toHaveTextContent('₩49,000');
    });

    it('should update footer summary when plan changes', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      const masterpieceCard = screen.getByTestId('plan-card-max');
      fireEvent.click(masterpieceCard);

      expect(screen.getByTestId('footer-plan-name')).toHaveTextContent('Masterpiece 패키지');
      expect(screen.getByTestId('footer-plan-price')).toHaveTextContent('₩99,000');
    });
  });

  describe('Plan Features', () => {
    it('should display photo count for each plan in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('12장 제공')).toBeInTheDocument();
      expect(screen.getByText('36장 제공')).toBeInTheDocument();
      expect(screen.getByText('60장 제공')).toBeInTheDocument();
    });

    it('should display regeneration count for each plan in Korean', () => {
      render(<PaymentStage onNext={mockOnNext} onBack={mockOnBack} />);

      expect(screen.getByText('재생성 1회')).toBeInTheDocument();
      expect(screen.getByText('재생성 3회')).toBeInTheDocument();
      expect(screen.getByText('재생성 무제한')).toBeInTheDocument();
    });
  });
});
