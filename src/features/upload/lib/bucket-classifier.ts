import {
  type BucketType,
  type FaceAnalysisResult,
  type QualityIssue,
  BUCKET_THRESHOLDS,
  BUCKET_TARGETS,
} from '../types';

/**
 * 4-Bucket Waterfall Logic: Classify face into bucket
 *
 * Step 1 (Critical Filter): Reject unusable photos → D
 *   - No face detected
 *   - Extreme angle (|yaw| >= 70°)
 *
 * Step 2 (Vibe Check): Smile detection → C
 *   - happyScore >= 0.7 → C (regardless of angle)
 *
 * Step 3 (Geometry Check): Angle-based classification
 *   - |yaw| <= 12° → A (frontal)
 *   - |yaw| <= 55° → B (semi-profile)
 *
 * Step 4 (Fallback): Remaining photos → D
 *   - 55° < |yaw| < 70° with low smile score (Dead Zone)
 */
export function classifyBucket(
  yawAngle: number,
  happyScore: number,
  eyesOpen: boolean,
  faceDetected: boolean
): { bucket: BucketType; qualityIssues: QualityIssue[]; isUsable: boolean; rejectionReason?: string } {
  const absYaw = Math.abs(yawAngle);
  const qualityIssues: QualityIssue[] = [];

  // Step 1: Critical Filter → D (Discard)
  if (!faceDetected) {
    return {
      bucket: 'D',
      qualityIssues: ['no_face'],
      isUsable: false,
      rejectionReason: '얼굴 미감지',
    };
  }

  if (absYaw >= BUCKET_THRESHOLDS.EXTREME_YAW) {
    return {
      bucket: 'D',
      qualityIssues: ['extreme_angle'],
      isUsable: false,
      rejectionReason: '각도 부적합',
    };
  }

  // Track eye closure as quality issue (but don't reject)
  if (!eyesOpen) {
    qualityIssues.push('eyes_closed');
  }

  // Step 2: Vibe Check → C (Smile shots)
  if (happyScore >= BUCKET_THRESHOLDS.MIN_HAPPY_SCORE) {
    return {
      bucket: 'C',
      qualityIssues,
      isUsable: qualityIssues.length === 0,
    };
  }

  // Step 3: Geometry Check → A (Frontal) or B (Semi-profile)
  if (absYaw <= BUCKET_THRESHOLDS.FRONTAL_MAX_YAW) {
    return {
      bucket: 'A',
      qualityIssues,
      isUsable: qualityIssues.length === 0,
    };
  }

  if (absYaw <= BUCKET_THRESHOLDS.SIDE_MAX_YAW) {
    return {
      bucket: 'B',
      qualityIssues,
      isUsable: qualityIssues.length === 0,
    };
  }

  // Step 4: Fallback → D (55° < |yaw| < 70° with no smile - Dead Zone)
  return {
    bucket: 'D',
    qualityIssues: ['extreme_angle'],
    isUsable: false,
    rejectionReason: `측면 범위 초과(${absYaw}°)`,
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

  // Update rejection reason if low resolution
  let rejectionReason = classification.rejectionReason;
  if (!isUsable && additionalIssues.includes('low_resolution')) {
    rejectionReason = rejectionReason ? `${rejectionReason}, 저해상도` : '저해상도';
  }

  return {
    faceDetected,
    yawAngle,
    smileScore,
    eyesOpen,
    bucket: classification.bucket,
    confidence,
    qualityIssues: allIssues,
    isUsable,
    rejectionReason,
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
    C: 'text-amber-500',
    D: 'text-gray-400',
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
    multiple_faces: '여러 얼굴 감지',
    face_too_small: '얼굴이 너무 작음',
  };
  return messages[issue];
}
