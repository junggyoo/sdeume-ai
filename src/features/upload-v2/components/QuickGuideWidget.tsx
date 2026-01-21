'use client';

import { motion } from 'framer-motion';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';

interface GuideItem {
  emoji: string;
  title: string;
  description: string;
  variant: 'good' | 'bad';
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    emoji: '😊',
    title: '정면 얼굴',
    description: '밝은 조명에서 카메라를 정면으로 바라보세요.',
    variant: 'good',
  },
  {
    emoji: '🙂',
    title: '다양한 표정',
    description: '자연스러운 미소와 무표정 모두 좋아요.',
    variant: 'good',
  },
  {
    emoji: '🕶️',
    title: '악세사리 제외',
    description: '선글라스, 모자, 마스크를 피해주세요.',
    variant: 'bad',
  },
  {
    emoji: '🌙',
    title: '밝은 조명',
    description: '얼굴에 그림자가 지지 않도록 해주세요.',
    variant: 'good',
  },
];

export function QuickGuideWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6"
    >
      <h3 className="text-lg font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Lightbulb className="text-amber-500" size={18} />
        빠른 가이드
      </h3>

      <div className="space-y-3">
        {GUIDE_ITEMS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex gap-4 p-3 bg-white/50 rounded-2xl border border-white/40"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                item.variant === 'good' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {item.emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
