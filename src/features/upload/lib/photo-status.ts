import type { QueuedFile } from '../types';

export type PhotoStatus =
  | 'valid'
  | 'warning'
  | 'invalid'
  | 'analyzing'
  | 'pending'
  | 'uploading'
  | 'error';

export type StatusColor = 'emerald' | 'amber' | 'red' | 'slate' | 'violet';

export type StatusIconName =
  | 'CheckCircle'
  | 'AlertCircle'
  | 'XCircle'
  | 'Loader2'
  | 'Clock'
  | 'Upload';

export interface PhotoStatusResult {
  status: PhotoStatus;
  message: string;
}

/**
 * QueuedFile의 상태를 사용자 친화적인 상태로 변환
 *
 * 버킷 매핑:
 * - A/B/C + 이슈 없음 → valid ("좋은 사진이에요!")
 * - A/B/C + eyes_closed → warning ("눈을 감았어요")
 * - D → invalid (rejectionReason 사용)
 */
export function getPhotoStatus(file: QueuedFile): PhotoStatusResult {
  // 진행 중인 상태 우선 처리
  if (file.status === 'analyzing') {
    return { status: 'analyzing', message: '분석 중...' };
  }

  if (file.status === 'pending') {
    return { status: 'pending', message: '대기 중' };
  }

  if (file.status === 'uploading') {
    return { status: 'uploading', message: '업로드 중...' };
  }

  if (file.status === 'error') {
    return { status: 'error', message: file.error ?? '오류가 발생했어요' };
  }

  // 분석 결과가 없으면 대기 중으로 처리
  if (!file.analysis) {
    return { status: 'pending', message: '대기 중' };
  }

  const { bucket, qualityIssues, rejectionReason } = file.analysis;

  // 버킷 D는 무조건 invalid
  if (bucket === 'D') {
    return {
      status: 'invalid',
      message: rejectionReason ?? '이 사진은 사용할 수 없어요',
    };
  }

  // 버킷 A/B/C: eyes_closed 이슈 확인
  if (qualityIssues.includes('eyes_closed')) {
    return { status: 'warning', message: '눈을 감았어요' };
  }

  // 버킷 A/B/C + 이슈 없음 (또는 eyes_closed 외 이슈)
  return { status: 'valid', message: '좋은 사진이에요!' };
}

/**
 * 상태에 따른 색상 반환
 */
export function getStatusColor(status: PhotoStatus): StatusColor {
  switch (status) {
    case 'valid':
      return 'emerald';
    case 'warning':
      return 'amber';
    case 'invalid':
    case 'error':
      return 'red';
    case 'uploading':
      return 'violet';
    case 'analyzing':
    case 'pending':
    default:
      return 'slate';
  }
}

/**
 * 상태에 따른 아이콘 이름 반환
 */
export function getStatusIcon(status: PhotoStatus): StatusIconName {
  switch (status) {
    case 'valid':
      return 'CheckCircle';
    case 'warning':
      return 'AlertCircle';
    case 'invalid':
    case 'error':
      return 'XCircle';
    case 'analyzing':
      return 'Loader2';
    case 'uploading':
      return 'Upload';
    case 'pending':
    default:
      return 'Clock';
  }
}
