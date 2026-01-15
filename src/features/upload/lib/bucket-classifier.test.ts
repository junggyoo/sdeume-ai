import { describe, it, expect } from 'vitest';
import { classifyBucket } from './bucket-classifier';
import { BUCKET_THRESHOLDS } from '../types';

describe('classifyBucket', () => {
  // 기본 파라미터
  const defaultHappyScore = 0.3; // 스마일 점수 낮음
  const eyesOpen = true;
  const faceDetected = true;

  describe('Step 1: Critical Filter - D bucket', () => {
    it('should return D when face is not detected', () => {
      const result = classifyBucket(0, 0.5, true, false);

      expect(result.bucket).toBe('D');
      expect(result.qualityIssues).toContain('no_face');
      expect(result.isUsable).toBe(false);
      expect(result.rejectionReason).toBe('얼굴 미감지');
    });

    it('should return D when yaw angle is >= EXTREME_YAW (70°)', () => {
      // 70° 이상은 극단적 각도로 D 처리
      const result = classifyBucket(70, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('D');
      expect(result.qualityIssues).toContain('extreme_angle');
      expect(result.isUsable).toBe(false);
    });

    it('should return D when yaw angle is -75° (extreme left)', () => {
      const result = classifyBucket(-75, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('D');
      expect(result.qualityIssues).toContain('extreme_angle');
    });
  });

  describe('Step 2: Vibe Check - C bucket (Smile)', () => {
    it('should return C when happyScore >= 0.7 regardless of angle', () => {
      const result = classifyBucket(30, 0.8, eyesOpen, faceDetected);

      expect(result.bucket).toBe('C');
      expect(result.isUsable).toBe(true);
    });

    it('should return C when happyScore = 0.7 (boundary)', () => {
      const result = classifyBucket(40, 0.7, eyesOpen, faceDetected);

      expect(result.bucket).toBe('C');
    });

    it('should return C even with eyes closed but high smile score', () => {
      const result = classifyBucket(20, 0.8, false, faceDetected);

      expect(result.bucket).toBe('C');
      expect(result.qualityIssues).toContain('eyes_closed');
      expect(result.isUsable).toBe(true); // 눈 감아도 C 버킷이면 사용 가능
    });
  });

  describe('Step 3: Geometry Check - A bucket (Frontal)', () => {
    it('should return A when |yaw| <= 12° (frontal)', () => {
      const result = classifyBucket(10, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('A');
      expect(result.isUsable).toBe(true);
    });

    it('should return A when yaw = 12° (boundary)', () => {
      const result = classifyBucket(12, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('A');
    });

    it('should return A when yaw = -12° (left boundary)', () => {
      const result = classifyBucket(-12, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('A');
    });

    it('should return A when yaw = 0° (perfect frontal)', () => {
      const result = classifyBucket(0, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('A');
    });
  });

  describe('Step 3: Geometry Check - B bucket (Semi-profile)', () => {
    it('should return B when 12° < |yaw| < 70° (all non-frontal angles before extreme)', () => {
      const result = classifyBucket(30, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.isUsable).toBe(true);
    });

    it('should return B when yaw = 13° (just over frontal boundary)', () => {
      const result = classifyBucket(13, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    it('should return B when yaw = 65° (SIDE_MAX_YAW boundary)', () => {
      const result = classifyBucket(65, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    it('should return B when yaw = -65° (left SIDE_MAX_YAW boundary)', () => {
      const result = classifyBucket(-65, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    // 핵심 테스트: 이전에 D로 분류되던 각도들 - 모두 B로 수용
    it('should return B when yaw = 39.5° (previously classified as D)', () => {
      const result = classifyBucket(39.5, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.isUsable).toBe(true);
    });

    it('should return B when yaw = 43.8° (previously classified as D)', () => {
      const result = classifyBucket(43.8, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    it('should return B when yaw = 46.6° (previously in Dead Zone)', () => {
      const result = classifyBucket(46.6, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    it('should return B when yaw = 51.1° (previously in Dead Zone)', () => {
      const result = classifyBucket(51.1, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
    });

    // 56°~69° 구간도 이제 B로 수용 (Dead Zone 제거)
    it('should return B when yaw = 56° (no more Dead Zone)', () => {
      const result = classifyBucket(56, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.isUsable).toBe(true);
    });

    it('should return B when yaw = 60° (no more Dead Zone)', () => {
      const result = classifyBucket(60, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.isUsable).toBe(true);
    });

    it('should return B when yaw = 69° (just under EXTREME_YAW)', () => {
      const result = classifyBucket(69, defaultHappyScore, eyesOpen, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.isUsable).toBe(true);
    });
  });

  describe('Eyes closed quality issue', () => {
    it('should track eyes_closed as quality issue but still be usable in A bucket', () => {
      const result = classifyBucket(10, defaultHappyScore, false, faceDetected);

      expect(result.bucket).toBe('A');
      expect(result.qualityIssues).toContain('eyes_closed');
      expect(result.isUsable).toBe(true); // 눈 감아도 A 버킷이면 사용 가능
    });

    it('should track eyes_closed as quality issue but still be usable in B bucket', () => {
      const result = classifyBucket(30, defaultHappyScore, false, faceDetected);

      expect(result.bucket).toBe('B');
      expect(result.qualityIssues).toContain('eyes_closed');
      expect(result.isUsable).toBe(true); // 눈 감아도 B 버킷이면 사용 가능
    });

    it('should track eyes_closed as quality issue but still be usable in C bucket', () => {
      const result = classifyBucket(40, 0.8, false, faceDetected);

      expect(result.bucket).toBe('C');
      expect(result.qualityIssues).toContain('eyes_closed');
      expect(result.isUsable).toBe(true); // 눈 감아도 C 버킷이면 사용 가능
    });
  });

  describe('Threshold constants validation', () => {
    it('should have correct FRONTAL_MAX_YAW value', () => {
      expect(BUCKET_THRESHOLDS.FRONTAL_MAX_YAW).toBe(12);
    });

    it('should have correct SIDE_MAX_YAW value', () => {
      expect(BUCKET_THRESHOLDS.SIDE_MAX_YAW).toBe(65);
    });

    it('should have correct EXTREME_YAW value', () => {
      expect(BUCKET_THRESHOLDS.EXTREME_YAW).toBe(70);
    });

    it('should have correct MIN_EYE_ASPECT_RATIO value (relaxed for Asian eyes)', () => {
      expect(BUCKET_THRESHOLDS.MIN_EYE_ASPECT_RATIO).toBe(0.1);
    });
  });
});
