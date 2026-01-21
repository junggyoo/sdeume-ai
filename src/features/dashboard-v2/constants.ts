/**
 * Atelier Gallery Dashboard UI 텍스트
 */
export const ATELIER_COPY = {
  header: {
    brand: 'Sdeume AI',
    status: 'RECEPTION',
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
    greeting: (name: string) => `Good Afternoon,`,
    userName: (name: string) => name,
    subtitle: 'Your studio is ready.',
    curatedLookbook: 'Curated Lookbook',
    viewAll: 'View All',
  },
  projectCard: {
    newSession: 'NEW SESSION',
    startNewShooting: 'Start New Shooting',
    startNow: 'Start Now',
    openGallery: 'Open Gallery',
    developing: 'DEVELOPING',
    completed: 'Completed',
  },
  widgets: {
    artistTip: {
      title: "Artist's Tip",
      tips: [
        'Close-up selfies with good lighting work best for training.',
        'Avoid photos with sunglasses, masks, or heavy filters.',
      ],
    },
    featuredTheme: {
      badge: "Editor's Pick",
      cta: 'Try this Theme',
    },
    membership: {
      title: 'My Membership',
      freePlan: 'FREE PLAN',
      proPlan: 'PRO PLAN',
      credits: 'Credits',
      upgrade: 'Upgrade to Pro',
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
