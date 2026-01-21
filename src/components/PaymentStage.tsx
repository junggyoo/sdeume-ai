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
    name: 'Essential',
    price: '29,900',
    originalPrice: '39,900',
    features: ['12 Photos', '1 Regeneration', 'Standard Quality', 'JPG Download'],
    saveBadge: null,
  },
  {
    id: 'pro',
    name: 'Signature',
    price: '49,900',
    originalPrice: '69,900',
    isBest: true,
    features: ['36 Photos', '3 Regenerations', '3 Themes', 'High Resolution', 'Priority Processing'],
    saveBadge: { text: 'SAVE 33%', color: 'bg-purple-600 text-white' },
  },
  {
    id: 'max',
    name: 'Masterpiece',
    price: '79,900',
    originalPrice: '129,900',
    features: ['60 Photos', '5 Regenerations', '5 Themes', '4K Ultra HD', 'Raw Files Included'],
    saveBadge: { text: 'SAVE 40%', color: 'bg-[#191F28] text-white' },
  },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: 'Credit Card', icon: CreditCard },
  { id: 'kakaopay', name: 'Kakao Pay', icon: Wallet },
  { id: 'toss', name: 'Toss', icon: Smartphone },
  { id: 'naverpay', name: 'Naver Pay', icon: Wallet },
];

export default function PaymentStage({ onNext, onBack }: PaymentStageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('card');

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  return (
    <div className="w-full max-w-7xl mx-auto pt-8 pb-32">
      {/* Header */}
      <div className="relative mb-12 px-6">
        <button
          onClick={onBack}
          aria-label="뒤로"
          className="absolute left-6 top-0 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif text-gray-900 leading-tight">
            Choose your <span className="italic text-purple-600">Collection.</span>
          </h1>
          <p className="text-lg text-gray-500 font-light">
            Select the perfect package to preserve your moments.
          </p>
        </div>
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
                  {isSelected ? 'Selected' : 'Select Plan'}
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
        <h2 className="text-lg font-serif font-bold mb-6 text-center text-gray-900">Payment Method</h2>
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
            <span className="font-semibold text-gray-700">100% Money-back Guarantee</span>
          </div>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-gray-300" />
          <span>If you&apos;re not satisfied with the results.</span>
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
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Selected Plan</p>
            <p data-testid="footer-plan-name" className="text-xl font-serif font-bold text-gray-900">
              {selectedPlan.name} Collection
            </p>
          </div>

          <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
            <div className="text-left md:text-right">
              <p className="text-xs text-gray-400 line-through decoration-gray-300 font-medium">
                ₩{selectedPlan.originalPrice}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-purple-600 font-bold">Total</span>
                <p data-testid="footer-plan-price" className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                  ₩{selectedPlan.price}
                </p>
              </div>
            </div>

            <button
              onClick={onNext}
              className="shrink-0 px-6 md:px-12 py-4 bg-[#191F28] text-white rounded-full font-bold text-base md:text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <span>Pay &amp; Start</span>
              <Sparkles size={18} className="text-purple-400 group-hover:animate-spin" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
