import { describe, it, expect } from 'vitest';
import {
  getPhotoStatus,
  getStatusColor,
  getStatusIcon,
  PhotoStatus,
} from './photo-status';
import type { QueuedFile, BucketType, QualityIssue } from '../types';

// 테스트용 QueuedFile 헬퍼
function createQueuedFile(
  overrides: Partial<QueuedFile> & {
    bucket?: BucketType;
    qualityIssues?: QualityIssue[];
    rejectionReason?: string;
  }
): QueuedFile {
  const { bucket, qualityIssues, rejectionReason, ...rest } = overrides;

  return {
    id: 'test-id',
    file: new File([], 'test.jpg'),
    role: 'bride',
    status: 'completed',
    progress: 100,
    analysis: bucket
      ? {
          faceDetected: true,
          yawAngle: 0,
          smileScore: 0.5,
          eyesOpen: !qualityIssues?.includes('eyes_closed'),
          bucket,
          confidence: 0.95,
          qualityIssues: qualityIssues ?? [],
          isUsable: bucket !== 'D',
          rejectionReason,
        }
      : undefined,
    ...rest,
  };
}

describe('photo-status', () => {
  describe('getPhotoStatus', () => {
    describe('진행 중인 상태', () => {
      it('should return analyzing status when status is analyzing', () => {
        const file = createQueuedFile({ status: 'analyzing', bucket: undefined });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('analyzing');
        expect(result.message).toBe('분석 중...');
      });

      it('should return pending status when status is pending', () => {
        const file = createQueuedFile({ status: 'pending', bucket: undefined });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('pending');
        expect(result.message).toBe('대기 중');
      });

      it('should return uploading status when status is uploading', () => {
        const file = createQueuedFile({ status: 'uploading', bucket: 'A' });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('uploading');
        expect(result.message).toBe('업로드 중...');
      });

      it('should return valid status when status is synced with valid bucket', () => {
        const file = createQueuedFile({ status: 'synced', bucket: 'A', qualityIssues: [] });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('valid');
        expect(result.message).toBe('좋은 사진이에요!');
      });
    });

    describe('버킷 A/B/C + 이슈 없음 → valid', () => {
      it.each(['A', 'B', 'C'] as BucketType[])(
        'should return valid for bucket %s with no quality issues',
        (bucket) => {
          const file = createQueuedFile({ bucket, qualityIssues: [] });
          const result = getPhotoStatus(file);

          expect(result.status).toBe('valid');
          expect(result.message).toBe('좋은 사진이에요!');
        }
      );
    });

    describe('버킷 A/B/C + eyes_closed → warning', () => {
      it.each(['A', 'B', 'C'] as BucketType[])(
        'should return warning for bucket %s with eyes_closed issue',
        (bucket) => {
          const file = createQueuedFile({
            bucket,
            qualityIssues: ['eyes_closed'],
          });
          const result = getPhotoStatus(file);

          expect(result.status).toBe('warning');
          expect(result.message).toBe('눈을 감았어요');
        }
      );
    });

    describe('버킷 D → invalid', () => {
      it('should return invalid for bucket D', () => {
        const file = createQueuedFile({
          bucket: 'D',
          qualityIssues: ['no_face'],
          rejectionReason: '얼굴이 인식되지 않아요',
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('invalid');
        expect(result.message).toBe('얼굴이 인식되지 않아요');
      });

      it('should use default message when rejectionReason is missing', () => {
        const file = createQueuedFile({
          bucket: 'D',
          qualityIssues: [],
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('invalid');
        expect(result.message).toBe('이 사진은 사용할 수 없어요');
      });
    });

    describe('여러 품질 이슈 우선순위', () => {
      it('should prioritize eyes_closed over other issues', () => {
        const file = createQueuedFile({
          bucket: 'B',
          qualityIssues: ['low_resolution', 'eyes_closed'],
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('warning');
        expect(result.message).toBe('눈을 감았어요');
      });

      it('should return valid when only non-eyes_closed issues exist', () => {
        const file = createQueuedFile({
          bucket: 'A',
          qualityIssues: ['low_resolution'],
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('valid');
        expect(result.message).toBe('좋은 사진이에요!');
      });

      it('should return valid when multiple non-eyes_closed issues exist', () => {
        const file = createQueuedFile({
          bucket: 'B',
          qualityIssues: ['low_resolution', 'negative_expression'],
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('valid');
        expect(result.message).toBe('좋은 사진이에요!');
      });
    });

    describe('에러 상태', () => {
      it('should return error status when status is error', () => {
        const file = createQueuedFile({
          status: 'error',
          error: '업로드 실패',
          bucket: undefined,
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('error');
        expect(result.message).toBe('업로드 실패');
      });

      it('should use default error message when error is missing', () => {
        const file = createQueuedFile({
          status: 'error',
          bucket: undefined,
        });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('error');
        expect(result.message).toBe('오류가 발생했어요');
      });
    });

    describe('분석 결과 없음', () => {
      it('should return pending when analysis is missing for completed status', () => {
        const file = createQueuedFile({ status: 'completed', bucket: undefined });
        const result = getPhotoStatus(file);

        expect(result.status).toBe('pending');
        expect(result.message).toBe('대기 중');
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return emerald for valid status', () => {
      expect(getStatusColor('valid')).toBe('emerald');
    });

    it('should return amber for warning status', () => {
      expect(getStatusColor('warning')).toBe('amber');
    });

    it('should return red for invalid status', () => {
      expect(getStatusColor('invalid')).toBe('red');
    });

    it('should return slate for analyzing status', () => {
      expect(getStatusColor('analyzing')).toBe('slate');
    });

    it('should return slate for pending status', () => {
      expect(getStatusColor('pending')).toBe('slate');
    });

    it('should return violet for uploading status', () => {
      expect(getStatusColor('uploading')).toBe('violet');
    });

    it('should return red for error status', () => {
      expect(getStatusColor('error')).toBe('red');
    });
  });

  describe('getStatusIcon', () => {
    it('should return CheckCircle for valid status', () => {
      expect(getStatusIcon('valid')).toBe('CheckCircle');
    });

    it('should return AlertCircle for warning status', () => {
      expect(getStatusIcon('warning')).toBe('AlertCircle');
    });

    it('should return XCircle for invalid status', () => {
      expect(getStatusIcon('invalid')).toBe('XCircle');
    });

    it('should return Loader2 for analyzing status', () => {
      expect(getStatusIcon('analyzing')).toBe('Loader2');
    });

    it('should return Clock for pending status', () => {
      expect(getStatusIcon('pending')).toBe('Clock');
    });

    it('should return Upload for uploading status', () => {
      expect(getStatusIcon('uploading')).toBe('Upload');
    });

    it('should return XCircle for error status', () => {
      expect(getStatusIcon('error')).toBe('XCircle');
    });
  });
});
