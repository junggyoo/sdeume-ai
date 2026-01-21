/**
 * Dashboard-v2 Types
 * Atelier Gallery 스타일 대시보드를 위한 타입 정의
 */

/**
 * 대시보드 단계 (The Atelier Journey)
 */
export type DashboardStep = 'home' | 'theme' | 'shooting';

/**
 * 사용자 플랜 타입
 */
export type PlanType = 'free' | 'pro';

/**
 * 프로젝트 상태
 */
export type ProjectStatus = 'processing' | 'completed';

/**
 * ProjectCard Props
 */
export interface ProjectCardProps {
  /** 카드 타입: 새 프로젝트 생성 또는 기존 프로젝트 */
  type: 'new' | 'existing';
  /** 프로젝트 제목 */
  title?: string;
  /** 날짜 (existing 타입에서 사용) */
  date?: string;
  /** 프로젝트 상태 (existing 타입에서 사용) */
  status?: ProjectStatus;
  /** 썸네일 이미지 URL (existing 타입에서 사용) */
  image?: string;
  /** 사진 수 (existing 타입에서 사용) */
  photoCount?: number;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * FeaturedThemeWidget Props
 */
export interface FeaturedThemeWidgetProps {
  /** 테마 이름 */
  themeName: string;
  /** 테마 설명 */
  description?: string;
  /** 이미지 URL */
  image?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

/**
 * LookbookCard Props
 */
export interface LookbookCardProps {
  /** 테마 이름 */
  themeName: string;
  /** 설명 */
  description: string;
  /** 이미지 URL */
  image: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

/**
 * UserMenu Props
 */
export interface UserMenuProps {
  /** 사용자 이름 */
  userName?: string;
  /** 사용자 이메일 */
  userEmail?: string;
  /** 사용자 아바타 URL */
  avatarUrl?: string;
  /** 플랜 타입 */
  planType?: PlanType;
  /** 남은 장수 */
  remainingCount?: number;
  /** 총 장수 */
  totalCount?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * AtelierHeader Props
 */
export interface AtelierHeaderProps {
  /** 스크롤 상태 */
  isScrolled?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * DashboardHome Props
 */
export interface DashboardHomeProps {
  /** 새 촬영 시작 핸들러 */
  onStartNew?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * useDashboardStep Hook 반환 타입
 */
export interface UseDashboardStepReturn {
  /** 현재 단계 */
  step: DashboardStep;
  /** 단계 설정 함수 */
  setStep: (step: DashboardStep) => void;
  /** 테마 선택 화면으로 이동 */
  goToTheme: () => void;
  /** 촬영 화면으로 이동 */
  goToShooting: () => void;
  /** 홈으로 이동 */
  goHome: () => void;
}

/**
 * TiltCard Props
 */
export interface TiltCardProps {
  /** 자식 요소 */
  children: React.ReactNode;
  /** 최대 기울기 각도 (도) */
  maxTilt?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * MagneticButton Props
 */
export interface MagneticButtonProps {
  /** 자식 요소 */
  children: React.ReactNode;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 자기장 강도 (픽셀) */
  magneticStrength?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}
