// Training phase rolling messages
export const TRAINING_MESSAGES = [
  '얼굴 특징 분석 중...',
  '표정 학습 중...',
  '광원 분석 중...',
  '피부 톤 매칭 중...',
  '스타일 적용 중...',
] as const;

// Animation configuration
export const DROP_ANIMATION = {
  initial: {
    y: -300,
    opacity: 0,
    scale: 1.1,
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  transition: {
    type: 'spring' as const,
    bounce: 0.4,
    duration: 0.5,
  },
} as const;

// Blur stages for drop image
export const BLUR_STAGES = {
  dropping: 'blur(12px)',
  processing: 'blur(8px)',
  revealed: 'blur(0px)',
} as const;

// Timing configuration (in ms)
export const TIMING = {
  messageRotation: 2500,
  messageTransition: 200,
  blurToProcessing: 500,
  processingToRevealed: 1500,
} as const;

// Timeout configuration (in ms)
export const TIMEOUTS = {
  training: 20 * 60 * 1000, // 20 minutes
  generating: 10 * 60 * 1000, // 10 minutes
} as const;

export type BlurStage = keyof typeof BLUR_STAGES;
