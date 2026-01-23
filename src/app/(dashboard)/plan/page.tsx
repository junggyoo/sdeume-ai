'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Check from 'lucide-react/dist/esm/icons/check';

export default function PlanPage() {
  const plans = [
    {
      name: 'Free',
      price: '무료',
      description: '스드메 AI를 체험해보세요',
      features: ['월 5장 생성', '기본 테마 3종', '720p 해상도'],
      current: true,
    },
    {
      name: 'Pro',
      price: '₩29,000/월',
      description: '더 많은 화보를 더 높은 품질로',
      features: ['월 30장 생성', '모든 테마 이용', '4K 해상도', '우선 생성'],
      current: false,
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: '문의',
      description: '대량 생성이 필요한 비즈니스용',
      features: ['무제한 생성', '커스텀 테마', 'API 접근', '전담 지원'],
      current: false,
    },
  ];

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          내 플랜
        </h1>
        <p className="mt-2 text-slate-400">
          나에게 맞는 플랜을 선택하세요
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-6 relative bg-slate-800/50 border-slate-700 ${
              plan.recommended
                ? 'border-violet-500 ring-2 ring-violet-500'
                : ''
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                추천
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold mt-2 text-white">{plan.price}</p>
              <p className="text-sm text-slate-400 mt-1">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${plan.current ? 'border-slate-600 text-slate-200' : 'bg-violet-600 hover:bg-violet-500'}`}
              variant={plan.current ? 'outline' : 'default'}
              disabled={plan.current}
            >
              {plan.current ? '현재 플랜' : '업그레이드'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
