'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface GuideItem {
  type: 'good' | 'bad';
  title: string;
  description: string;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    type: 'good',
    title: '얼굴이 선명하게 보이는 사진',
    description: '조명이 밝고 얼굴이 또렷하게 보여야 해요',
  },
  {
    type: 'good',
    title: '다양한 각도의 사진',
    description: '정면, 측면, 45도 등 여러 각도가 좋아요',
  },
  {
    type: 'good',
    title: '자연스러운 표정',
    description: '웃는 얼굴, 진지한 얼굴 등 다양한 표정',
  },
  {
    type: 'bad',
    title: '선글라스/마스크 착용',
    description: '얼굴을 가리는 액세서리는 피해주세요',
  },
  {
    type: 'bad',
    title: '흐릿하거나 어두운 사진',
    description: '화질이 좋지 않으면 학습 효과가 떨어져요',
  },
  {
    type: 'bad',
    title: '얼굴이 너무 작은 단체 사진',
    description: '얼굴이 전체 사진의 10% 이상이어야 해요',
  },
];

interface OXGuideProps {
  className?: string;
}

export function OXGuide({ className }: OXGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const goodItems = GUIDE_ITEMS.filter((item) => item.type === 'good');
  const badItems = GUIDE_ITEMS.filter((item) => item.type === 'bad');

  // Show only 2 items when collapsed
  const visibleGoodItems = isExpanded ? goodItems : goodItems.slice(0, 2);
  const visibleBadItems = isExpanded ? badItems : badItems.slice(0, 2);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 bg-secondary/50">
        <h3 className="font-semibold text-primary-desktop flex items-center gap-2">
          📸 좋은 사진 선택 가이드
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          AI가 잘 학습할 수 있는 사진을 선택해주세요
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Good Examples */}
        <div>
          <h4 className="text-sm font-medium text-accent-teal mb-2 flex items-center gap-1">
            <Check className="w-4 h-4" /> 이런 사진이 좋아요
          </h4>
          <div className="space-y-2">
            {visibleGoodItems.map((item, i) => (
              <GuideItemCard key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Bad Examples */}
        <div>
          <h4 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
            <X className="w-4 h-4" /> 이런 사진은 피해주세요
          </h4>
          <div className="space-y-2">
            {visibleBadItems.map((item, i) => (
              <GuideItemCard key={i} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 border-t"
      >
        {isExpanded ? (
          <>
            접기 <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            더보기 <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </Card>
  );
}

interface GuideItemCardProps {
  item: GuideItem;
}

function GuideItemCard({ item }: GuideItemCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg',
        item.type === 'good' ? 'bg-accent-teal/5' : 'bg-red-50'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          item.type === 'good' ? 'bg-accent-teal text-white' : 'bg-red-500 text-white'
        )}
      >
        {item.type === 'good' ? (
          <Check className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{item.title}</p>
        <p className="text-xs text-gray-500">{item.description}</p>
      </div>
    </div>
  );
}
