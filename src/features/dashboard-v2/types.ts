/**
 * Dashboard-v2 Types
 * Atelier Gallery 스타일 대시보드를 위한 타입 정의
 */

import type { DashboardState } from '@/features/dashboard/types';
import type { Project } from '@/features/project/types';

// Re-export for convenience
export type { DashboardState };

/**
 * 대시보드 단계 (The Atelier Journey)
 */
export type DashboardStep = 'home' | 'theme' | 'shooting';

/**
 * 사용자 플랜 타입
 */
export type PlanType = 'free' | 'pro';

/**
 * 프로젝트 상태 (UI 표시용)
 */
export type ProjectStatus = 'processing' | 'completed' | 'pending';

/**
 * 변환된 프로젝트 데이터 (ProjectCard용)
 */
export interface TransformedProject {
  id: string;
  title: string;
  date: string;
  image: string | null;
  status: ProjectStatus;
  projectId: string;
}

/**
 * ProjectCard Props
 */
export interface ProjectCardProps {
  /** 카드 타입: 새 프로젝트 생성 또는 기존 프로젝트 */
  type: 'new' | 'existing';
  /** 프로젝트 ID (existing 타입에서 네비게이션용) */
  projectId?: string;
  /** 프로젝트 제목 */
  title?: string;
  /** 날짜 (existing 타입에서 사용) */
  date?: string;
  /** 프로젝트 상태 (existing 타입에서 사용) */
  status?: ProjectStatus;
  /** 썸네일 이미지 URL (existing 타입에서 사용) */
  image?: string | null;
  /** 사진 수 (existing 타입에서 사용) */
  photoCount?: number;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 로딩 상태 (new 타입에서 생성 중 표시용) */
  isLoading?: boolean;
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
  /** 새 촬영 생성 중 여부 */
  isCreating?: boolean;
}

/**
 * 프로젝트 상태를 UI용 ProjectStatus로 변환하는 헬퍼
 */
export function getProjectDisplayStatus(project: Project): ProjectStatus {
  const status = project.status;
  if (status === 'training' || status === 'generating') {
    return 'processing';
  }
  if (status === 'completed') {
    return 'completed';
  }
  return 'pending';
}

/**
 * 날짜를 포맷팅하는 헬퍼
 */
export function formatProjectDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
