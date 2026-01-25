// Phase definitions for waiting screen
export type WaitingPhase = 'learning' | 'generating' | 'complete';

export interface PhaseConfig {
  id: WaitingPhase;
  title: string;
  subtitle: string;
  icon: 'Wand2' | 'Camera' | 'CheckCircle';
  duration: string;
  color: 'purple' | 'amber' | 'emerald';
  messages: readonly string[];
}

export const PHASES: Record<WaitingPhase, PhaseConfig> = {
  learning: {
    id: 'learning',
    title: '얼굴 학습 중',
    subtitle: 'AI가 두 분의 얼굴을 익히고 있어요',
    icon: 'Wand2',
    duration: '약 10~15분',
    color: 'purple',
    messages: [
      '얼굴 특징을 분석하고 있어요...',
      '빛의 각도를 연구하고 있어요...',
      '표정의 미묘한 차이를 확인 중...',
      '두 분의 조화를 계산하고 있어요...',
      '최적의 스타일을 찾고 있어요...',
    ],
  },
  generating: {
    id: 'generating',
    title: '화보 촬영 중',
    subtitle: '{themeName}에서 촬영이 진행되고 있어요',
    icon: 'Camera',
    duration: '약 5분',
    color: 'amber',
    messages: [
      '조명을 세팅하고 있어요...',
      '조리개를 조절하고 있어요...',
      '최고의 순간을 포착 중...',
      '자연스러운 포즈를 연출 중...',
      '마법 같은 장면을 담고 있어요...',
    ],
  },
  complete: {
    id: 'complete',
    title: '촬영 완료!',
    subtitle: '{count}장의 아름다운 화보가 완성되었어요',
    icon: 'CheckCircle',
    duration: '',
    color: 'emerald',
    messages: [],
  },
} as const;

// Phase color configurations
export const PHASE_COLORS = {
  purple: {
    stroke: '#a855f7',
    glow: 'rgba(147, 51, 234, 0.6)',
    bg: 'rgba(168, 85, 247, 0.15)',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
  amber: {
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    bg: 'rgba(245, 158, 11, 0.15)',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  emerald: {
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.6)',
    bg: 'rgba(16, 185, 129, 0.15)',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
} as const;

// Training phase rolling messages (legacy - kept for backward compatibility)
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
  messageRotation: 5000, // 5초마다 롤링 텍스트 변경
  messageTransition: 200,
  blurToProcessing: 500,
  processingToRevealed: 1500,
  progressUpdate: 1000, // 1초마다 진행률 업데이트
} as const;

// Progress calculation constants
export const PROGRESS_CONFIG = {
  learningDuration: 10 * 60 * 1000, // 10분 = learning 단계 완료
  learningMaxProgress: 50, // learning 단계 최대 진행률
  totalImages: 12, // 총 생성 이미지 수 (3 batches x 4 images)
} as const;

// Timeout configuration (in ms)
export const TIMEOUTS = {
  training: 20 * 60 * 1000, // 20 minutes
  generating: 10 * 60 * 1000, // 10 minutes
} as const;

export type BlurStage = keyof typeof BLUR_STAGES;
