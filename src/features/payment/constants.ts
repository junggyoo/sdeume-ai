import type { Package, PaymentMethod } from './types';

export const PACKAGES: Package[] = [
  {
    id: 'basic',
    name: 'Basic',
    nameKr: '베이직',
    price: 29900,
    originalPrice: 39900,
    discount: 25,
    themeCount: 1,
    features: [
      { icon: '📸', text: '화보 12장 생성' },
      { icon: '🔄', text: '재생성 1회' },
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKr: '프로',
    price: 49900,
    originalPrice: 69900,
    discount: 29,
    themeCount: 3,
    features: [
      { icon: '📸', text: '화보 36장 생성' },
      { icon: '🔄', text: '재생성 3회' },
      { icon: '🎨', text: '3개 테마 선택 가능' },
    ],
    recommended: true,
  },
  {
    id: 'max',
    name: 'Max',
    nameKr: '맥스',
    price: 79900,
    originalPrice: 119900,
    discount: 33,
    themeCount: 5,
    features: [
      { icon: '📸', text: '화보 60장 생성' },
      { icon: '🔄', text: '재생성 5회' },
      { icon: '🎨', text: '5개 테마 선택 가능' },
      { icon: '✨', text: '프리미엄 보정' },
    ],
    recommended: false,
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: '신용/체크카드', color: 'slate' },
  { id: 'kakao', name: '카카오페이', color: 'yellow' },
  { id: 'naver', name: '네이버페이', color: 'green' },
  { id: 'toss', name: '토스페이', color: 'blue' },
];

export const FALLBACK_THEMES = [
  {
    id: 'white_studio',
    name: '화이트 스튜디오',
    thumbnailUrl: 'https://picsum.photos/seed/white/400/300',
  },
  {
    id: 'garden_studio',
    name: '가든 스튜디오',
    thumbnailUrl: 'https://picsum.photos/seed/garden/400/300',
  },
  {
    id: 'classic_studio',
    name: '클래식 스튜디오',
    thumbnailUrl: 'https://picsum.photos/seed/classic/400/300',
  },
];
