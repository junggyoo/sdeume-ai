/**
 * 시간대별 인사말 타입
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * 현재 시간대를 반환하는 헬퍼 함수
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * 시간대별 인사말 (한글)
 */
export const TIME_GREETINGS: Record<TimeOfDay, string> = {
  morning: '좋은 아침이에요,',
  afternoon: '좋은 오후예요,',
  evening: '좋은 저녁이에요,',
  night: '늦은 밤이에요,',
} as const;

/**
 * 시간대에 맞는 인사말을 반환
 */
export function getGreeting(): string {
  return TIME_GREETINGS[getTimeOfDay()];
}

/**
 * 스튜디오 상태 타입
 */
export type StudioStatus = 'idle' | 'processing' | 'completed';

/**
 * 스튜디오 상태별 텍스트
 */
export const STUDIO_STATUS_TEXT: Record<StudioStatus, string> = {
  idle: '대기 중',
  processing: '생성 중',
  completed: '완료',
} as const;

/**
 * Atelier Gallery Dashboard UI 텍스트
 */
export const ATELIER_COPY = {
  header: {
    brand: 'Sdeume AI',
    statusLabel: '스튜디오 상태',
  },
  userMenu: {
    myFace: '내 얼굴',
    gallery: '갤러리',
    settings: '설정',
    logout: '로그아웃',
    remaining: (count: number) => `${count}장 남음`,
    proPlan: 'Pro 플랜',
    freePlan: 'Free 플랜',
  },
  reception: {
    /** @deprecated Use getGreeting() instead for time-based greeting */
    greeting: (name: string) => `Good Afternoon,`,
    userName: (name: string) => name,
    subtitle: '스튜디오가 준비됐어요.',
    curatedLookbook: '큐레이션 룩북',
    viewAll: '전체 보기',
    inspiration: 'INSPIRATION',
  },
  projectCard: {
    newSession: '새 촬영',
    startNewShooting: '새 촬영 시작하기',
    startNow: '지금 시작',
    openGallery: '갤러리 열기',
    viewProgress: '진행 보기',
    developing: '생성 중',
    completed: '완료',
    continue: '이어하기',
    // 새로운 상태별 텍스트
    selectTheme: '테마 고르기',
    payAndStart: '결제하고 시작',
    // 상태 배지
    themeSelectingBadge: '테마 선택중',
    paymentPendingBadge: '결제 대기',
  },
  widgets: {
    artistTip: {
      title: '작가의 팁',
      tips: [
        '조명이 좋은 얼굴 클로즈업 사진이 학습에 가장 좋아요.',
        '선글라스·마스크·강한 필터가 들어간 사진은 피해주세요.',
      ],
    },
    featuredTheme: {
      badge: '에디터 픽',
      cta: '이 테마 체험하기',
    },
    membership: {
      title: '내 멤버십',
      freePlan: '무료 플랜',
      proPlan: 'PRO 플랜',
      credits: '크레딧',
      upgrade: 'Pro로 업그레이드',
    },
  },
  lookbook: {
    themes: {
      gardenWhisper: {
        name: 'Garden Whisper',
        description: '만개한 수국 사이로 비치는 부드러운 햇살.',
      },
      midnightVogue: {
        name: 'Midnight Vogue',
        description: '도시의 하이콘트라스트 플래시 무드.',
      },
      vintageFilm: {
        name: 'Vintage Film',
        description: '90년대 감성의 필름 그레인과 따뜻한 톤.',
      },
      etherealMist: {
        name: 'Ethereal Mist',
        description: '몽환적인 안개와 파스텔 컬러 팔레트.',
      },
      royalPalace: {
        name: 'Royal Palace',
        description: '왕실 웨딩의 품격을 담아보세요.',
      },
      classicStudio: {
        name: 'Classic Studio',
        description: '클래식한 스튜디오 무드.',
      },
    },
  },
} as const;

/**
 * 네비게이션 경로
 */
export const ATELIER_ROUTES = {
  dashboard: '/dashboard',
  gallery: '/gallery',
  faceManagement: '/face-management',
  settings: '/settings',
} as const;

/**
 * 애니메이션 설정
 */
export const ATELIER_ANIMATION = {
  /** 페이지 전환 */
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  /** 카드 호버 */
  cardHover: {
    y: -8,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  /** 드롭다운 */
  dropdown: {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  /** Stagger children */
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  /** Stagger item */
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
} as const;

/**
 * 그리드 설정
 */
export const ATELIER_GRID = {
  /** 12 컬럼 메인 그리드 */
  main: 'grid grid-cols-12 gap-6',
  /** 프로젝트 카드 그리드 */
  projects: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  /** 사이드 위젯 컬럼 span */
  mainContent: 'col-span-12 lg:col-span-8',
  sideContent: 'col-span-12 lg:col-span-4',
} as const;

/**
 * 헤더 높이 설정
 */
export const HEADER_HEIGHT = {
  default: 'h-24',
  scrolled: 'h-20',
  padding: 'pt-32',
} as const;
