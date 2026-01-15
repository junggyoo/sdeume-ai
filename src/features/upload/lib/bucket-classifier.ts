import {
  type BucketType,
  type FaceAnalysisResult,
  type QualityIssue,
  BUCKET_THRESHOLDS,
  BUCKET_TARGETS,
} from '../types';

/**
 * Waterfall Logic: Classify face into bucket
 *
 * Step 0: Quality Filter (eyes closed, extreme angle)
 * Step 1: Angle Classification (A: frontal, B: semi-profile)
 * Step 2: Smile Classification (C: happy expression regardless of angle)
 */
export function classifyBucket(
  yawAngle: number,
  happyScore: number,
  eyesOpen: boolean,
  faceDetected: boolean
): { bucket: BucketType; qualityIssues: QualityIssue[]; isUsable: boolean } {
  const qualityIssues: QualityIssue[] = [];
  const absYaw = Math.abs(yawAngle);

  // No face detected
  if (!faceDetected) {
    return {
      bucket: 'C',
      qualityIssues: ['no_face'],
      isUsable: false,
    };
  }

  // Step 0: Quality Filter
  if (!eyesOpen) {
    qualityIssues.push('eyes_closed');
  }

  if (absYaw >= BUCKET_THRESHOLDS.EXTREME_YAW) {
    qualityIssues.push('extreme_angle');
  }

  // Step 1: Angle-based classification
  if (absYaw < BUCKET_THRESHOLDS.FRONTAL_MAX_YAW) {
    // Bucket A: Identity (frontal)
    return {
      bucket: 'A',
      qualityIssues,
      isUsable: qualityIssues.length === 0,
    };
  }

  if (absYaw < BUCKET_THRESHOLDS.SIDE_MAX_YAW) {
    // Bucket B: Structure (semi-profile)
    return {
      bucket: 'B',
      qualityIssues,
      isUsable: qualityIssues.length === 0,
    };
  }

  // Step 2: For angles >= 35°, check if it's a smile shot worth keeping
  if (happyScore >= BUCKET_THRESHOLDS.MIN_HAPPY_SCORE) {
    // Bucket C: Vibe (smile shot) - keep despite angle
    return {
      bucket: 'C',
      qualityIssues,
      isUsable: qualityIssues.filter((i) => i !== 'extreme_angle').length === 0,
    };
  }

  // Angle too extreme and no good expression - classify as C but not ideal
  if (!qualityIssues.includes('extreme_angle')) {
    qualityIssues.push('extreme_angle');
  }

  return {
    bucket: 'C',
    qualityIssues,
    isUsable: false,
  };
}

/**
 * Create a full face analysis result with Waterfall Logic
 */
export function createFaceAnalysisResult(
  faceDetected: boolean,
  yawAngle: number,
  smileScore: number,
  eyesOpen: boolean,
  confidence: number,
  additionalIssues: QualityIssue[] = []
): FaceAnalysisResult {
  const classification = classifyBucket(yawAngle, smileScore, eyesOpen, faceDetected);

  // Merge additional quality issues (like low_resolution)
  const allIssues = [...new Set([...classification.qualityIssues, ...additionalIssues])];
  const isUsable = classification.isUsable && !additionalIssues.includes('low_resolution');

  return {
    faceDetected,
    yawAngle,
    smileScore,
    eyesOpen,
    bucket: classification.bucket,
    confidence,
    qualityIssues: allIssues,
    isUsable,
  };
}

/**
 * Get bucket label in Korean
 */
export function getBucketLabel(bucket: BucketType): string {
  return BUCKET_TARGETS[bucket].label;
}

/**
 * Get bucket color for UI
 */
export function getBucketColor(bucket: BucketType): string {
  const colors: Record<BucketType, string> = {
    A: 'text-accent-teal',
    B: 'text-accent-rose',
    C: 'text-gray-500',
  };
  return colors[bucket];
}

/**
 * Get quality issue message in Korean
 */
export function getQualityIssueMessage(issue: QualityIssue): string {
  const messages: Record<QualityIssue, string> = {
    eyes_closed: '눈 감음',
    low_resolution: '저해상도',
    no_face: '얼굴 미감지',
    negative_expression: '부정적 표정',
    extreme_angle: '과도한 각도',
  };
  return messages[issue];
}
