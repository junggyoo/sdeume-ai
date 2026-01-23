'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { cn } from '@/lib/utils';

// Types
type PlanId = 'basic' | 'pro' | 'max';
type PaymentMethodId = 'card' | 'kakaopay' | 'toss' | 'naverpay';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  originalPrice: string;
  features: string[];
  isBest?: boolean;
  saveBadge: { text: string; color: string } | null;
}

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface PaymentStageProps {
  onNext: () => void;
  onBack: () => void;
}

// Constants
const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '19,900',
    originalPrice: '29,900',
    features: ['1개 테마', '12장 제공', '재생성 1회', 'JPG 다운로드'],
    saveBadge: null,
  },
  {
    id: 'pro',
    name: 'Signature',
    price: '49,000',
    originalPrice: '69,000',
    isBest: true,
    features: ['3개 테마', '36장 제공', '재생성 3회', '세부 보정 5회', '고해상도 다운로드'],
    saveBadge: { text: 'SAVE 33%', color: 'bg-purple-600 text-white' },
  },
  {
    id: 'max',
    name: 'Masterpiece',
    price: '99,000',
    originalPrice: '149,000',
    features: ['테마 무제한', '60장 제공', '재생성 무제한', '세부 보정 무제한', '4K 초고해상도'],
    saveBadge: { text: 'SAVE 40%', color: 'bg-[#191F28] text-white' },
  },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: '신용카드', icon: CreditCard },
  { id: 'kakaopay', name: '카카오페이', icon: Wallet },
  { id: 'toss', name: '토스', icon: Smartphone },
  { id: 'naverpay', name: '네이버페이', icon: Wallet },
];

export default function PaymentStage({ onNext, onBack }: PaymentStageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('card');

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  return (
    <div className="w-full max-w-7xl mx-auto pt-8 pb-32">
      {/* Header */}
      <div className="relative w-full text-center mb-12 md:mb-16 space-y-4 max-w-7xl mx-auto px-6">
        {/* Mobile Back Button */}
        <button
          onClick={onBack}
          aria-label="뒤로"
          className="absolute left-6 top-0 md:hidden text-gray-400 hover:text-gray-900 transition-colors z-50"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Desktop Back Button */}
        <button
          onClick={onBack}
          aria-label="뒤로"
          className="absolute left-6 top-2 text-gray-400 hover:text-gray-900 text-sm items-center gap-1 transition-colors hidden md:flex z-50"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-4xl md:text-6xl font-serif text-gray-900 leading-tight">
          나만의 <span className="italic text-purple-600">패키지</span> 선택
        </h1>
        <p className="text-lg text-gray-500 font-light">
          소중한 순간을 담을 완벽한 패키지를 선택하세요.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-6 items-start">
        {PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isBest = plan.isBest;

          return (
            <motion.button
              key={plan.id}
              data-testid={`plan-card-${plan.id}`}
              onClick={() => setSelectedPlanId(plan.id)}
              aria-selected={isSelected}
              aria-label={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isSelected ? 1.02 : 1,
              }}
              whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'relative p-8 rounded-[32px] cursor-pointer transition-all duration-300 border-2 flex flex-col h-full text-left',
                isSelected
                  ? 'bg-white/80 backdrop-blur-xl border-purple-400 shadow-2xl shadow-purple-200/50 z-10 ring-4 ring-purple-50'
                  : 'bg-white/40 backdrop-blur-md border-transparent hover:bg-white/60 hover:border-purple-100 shadow-lg',
                isBest && !isSelected ? 'border-purple-100' : ''
              )}
            >
              {isBest && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#191F28] text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
                  <Sparkles size={12} className="text-purple-400 fill-purple-400" /> Most Loved
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={cn('text-2xl font-serif', isSelected ? 'text-purple-900' : 'text-gray-900')}>
                    {plan.name}
                  </h3>
                  {plan.saveBadge && (
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold tracking-wide', plan.saveBadge.color)}>
                      {plan.saveBadge.text}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-gray-400 font-serif">₩</span>
                  <span className="text-4xl font-bold text-gray-900 font-serif tracking-tight">{plan.price}</span>
                  <span className="text-sm text-gray-400 line-through decoration-gray-300 decoration-2 ml-1">
                    {plan.originalPrice}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-gray-600">
                      <div
                        className={cn(
                          'mt-0.5 p-1 rounded-full flex-shrink-0',
                          isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={isSelected ? 'font-medium text-gray-800' : ''}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Only Select Button */}
              <div className="md:hidden mt-4">
                <div
                  className={cn(
                    'w-full py-3 rounded-xl flex items-center justify-center font-bold text-sm transition-colors',
                    isSelected ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400'
                  )}
                >
                  {isSelected ? '선택됨' : '선택하기'}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-16 max-w-2xl mx-auto px-6"
      >
        <h2 className="text-lg font-serif font-bold mb-6 text-center text-gray-900">결제 수단</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isMethodSelected = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                data-testid={`payment-method-${method.id}`}
                onClick={() => setPaymentMethod(method.id)}
                aria-selected={isMethodSelected}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border transition-all duration-200',
                  isMethodSelected
                    ? 'bg-[#191F28] text-white border-[#191F28] shadow-lg scale-105'
                    : 'bg-white/50 border-white hover:bg-white hover:border-gray-200 text-gray-500 shadow-sm'
                )}
              >
                <Icon size={24} className={isMethodSelected ? 'text-purple-400' : 'text-gray-400'} />
                <span className="text-sm font-bold">{method.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Refund Guarantee Trust Signal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 max-w-2xl mx-auto px-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-sm text-gray-500 bg-purple-50/50 py-4 px-6 rounded-2xl border border-purple-100/80 text-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-600" />
            <span className="font-semibold text-gray-700">안 닮으면 100% 환불</span>
          </div>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-gray-300" />
          <span>결과물이 만족스럽지 않으면 전액 환불해 드립니다.</span>
        </div>
      </motion.div>

      {/* Sticky Footer */}
      <motion.div
        data-testid="payment-footer"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden md:flex flex-col">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">선택한 패키지</p>
            <p data-testid="footer-plan-name" className="text-xl font-serif font-bold text-gray-900">
              {selectedPlan.name} 패키지
            </p>
          </div>

          <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
            <div className="text-left md:text-right">
              <p className="text-xs text-gray-400 line-through decoration-gray-300 font-medium">
                ₩{selectedPlan.originalPrice}
              </p>
              <div className="flex items-baseline">
                <p data-testid="footer-plan-price" className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                  ₩{selectedPlan.price}
                </p>
              </div>
            </div>

            <button
              onClick={onNext}
              className="shrink-0 px-6 md:px-12 py-4 bg-[#191F28] text-white rounded-full font-bold text-base md:text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <span>결제하고 시작하기</span>
              <Sparkles size={18} className="text-purple-400 group-hover:animate-spin" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
