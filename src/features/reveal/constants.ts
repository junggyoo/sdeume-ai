/**
 * Reveal 페이지 애니메이션 타이밍 상수
 * 디자인 가이드 기준: "Reveal: 왁스 실링 → Light Bloom 350–500ms → Gallery Fade"
 */
export const REVEAL_TIMING = {
  /** 왁스 실링 깨짐 애니메이션 */
  sealBreak: 350,
  /** 봉투 열림 애니메이션 */
  envelopeOpen: 500,
  /** 빛 번짐 효과 */
  lightBloom: 400,
  /** 갤러리 페이드인 */
  galleryFade: 400,
} as const;

/**
 * 왁스 실링 애니메이션 설정
 */
export const SEAL_ANIMATION = {
  initial: { scale: 1, opacity: 1 },
  breaking: { scale: 1.2, opacity: 0 },
  transition: { duration: REVEAL_TIMING.sealBreak / 1000, ease: 'easeOut' },
} as const;

/**
 * 봉투 플랩 애니메이션 설정
 */
export const ENVELOPE_ANIMATION = {
  initial: { rotateX: 0 },
  open: { rotateX: -180 },
  transition: {
    duration: REVEAL_TIMING.envelopeOpen / 1000,
    delay: REVEAL_TIMING.sealBreak / 1000,
    ease: 'easeInOut',
  },
} as const;

/**
 * 빛 번짐(Light Bloom) 애니메이션 설정
 */
export const LIGHT_BLOOM_ANIMATION = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1.5 },
  transition: {
    duration: REVEAL_TIMING.lightBloom / 1000,
    delay: (REVEAL_TIMING.sealBreak + REVEAL_TIMING.envelopeOpen) / 1000,
  },
} as const;

/**
 * 갤러리 페이드 애니메이션 설정
 */
export const GALLERY_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: REVEAL_TIMING.galleryFade / 1000 },
} as const;

/**
 * Masonry 레이아웃 설정
 */
export const MASONRY_CONFIG = {
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  },
  gap: 16, // Tailwind gap-4
} as const;

/**
 * 포토 카드 aspect ratio 설정
 */
export const ASPECT_RATIOS = ['3/4', '4/5', '9/14'] as const;

/**
 * 하단 액션바 높이 (safe area 제외)
 */
export const BOTTOM_ACTION_BAR_HEIGHT = 80;
