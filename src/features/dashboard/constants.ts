/**
 * Korean copy for dashboard states
 */
export const DASHBOARD_COPY = {
  // Page
  pageTitle: '마이 스튜디오',

  // Hero - Onboarding State (true new user without face uploads)
  onboarding: {
    title: '나만의 AI 웨딩 화보를 만들어보세요',
    subtitle: '얼굴 사진을 등록하고 다양한 테마의 웨딩 화보를 생성해보세요',
    ctaButton: '얼굴 모델 등록하기',
  },

  // Hero - Processing State
  processing: {
    title: '화보를 생성하고 있어요',
    subtitle: '잠시만 기다려주세요. AI가 멋진 화보를 만들고 있습니다.',
    statusTraining: '얼굴 학습 중...',
    statusGenerating: '이미지 생성 중...',
  },

  // Hero - Ready State
  ready: {
    title: '새로운 화보를 촬영해보세요',
    subtitle: '다양한 테마로 더 많은 웨딩 화보를 만들어보세요',
    ctaButton: '새 촬영 시작하기',
  },

  // Gallery
  gallery: {
    title: '내 화보',
    emptyState: '아직 완성된 화보가 없어요',
    emptyStateSubtitle: '첫 번째 화보를 생성해보세요',
    photoCount: (count: number) => `${count}장`,
  },

  // Sidebar
  sidebar: {
    brand: '스드메 AI',
    brandSubtitle: 'AI 웨딩 스튜디오',
    nav: {
      myStudio: '마이 스튜디오',
      gallery: '갤러리',
      faceManagement: '내 얼굴 관리',
      myPlan: '내 플랜',
    },
    help: '도움말',
    settings: '설정',
    upgrade: '업그레이드',
    remaining: (count: number) => `${count}장 남음`,
  },

  // Status Labels
  statusLabels: {
    draft: '초안',
    uploading: '업로드 중',
    theme_selecting: '테마 선택',
    training: '학습 중',
    generating: '생성 중',
    completed: '완료',
    failed: '실패',
  },
} as const;

/**
 * Grid configuration for responsive layout
 */
export const GRID_CONFIG = {
  // Main layout: sidebar + content
  layout: 'grid md:grid-cols-[280px_1fr] gap-6',

  // Gallery grid responsive classes
  gallery: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6',

  // Sidebar width
  sidebarWidth: '280px',
} as const;

/**
 * Processing status mappings for project status
 */
export const PROCESSING_STATUSES = ['training', 'generating'] as const;

/**
 * Completed status for filtering
 */
export const COMPLETED_STATUS = 'completed' as const;
