export type UploadRole = 'groom' | 'bride';

export type BucketType = 'A' | 'B' | 'C' | 'D';

export interface FaceAnalysisResult {
  faceDetected: boolean;
  yawAngle: number; // -90 to 90 (negative: left, positive: right)
  rollAngle: number; // -180 to 180 (head tilt / image rotation)
  smileScore: number; // 0.0 to 1.0 (happy expression score)
  eyesOpen: boolean; // Eye Aspect Ratio check
  bucket: BucketType;
  confidence: number;
  qualityIssues: QualityIssue[];
  isUsable: boolean; // Passed all quality checks
  rejectionReason?: string; // Reason for D bucket classification
  wasRotated?: boolean; // True if automatic rotation was applied
  rotationApplied?: 0 | 90 | -90 | 180; // Rotation angle applied to correct image
  /** Rotation applied during analyzeFace fallback (0, 90, -90, 180). UI should apply CSS transform. */
  appliedRotation?: 0 | 90 | -90 | 180;
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  imageWidth?: number;
  imageHeight?: number;
}

export interface Upload {
  id: string;
  projectId: string;
  userId: string;
  role: UploadRole;
  originalUrl: string;
  croppedUrl: string | null;
  bucketType: BucketType | null;
  faceYaw: number | null;
  smileScore: number | null;
  qualityScore: number | null;
  isSelected: boolean;
  cropMode: 'original' | 'face' | 'body';
  cropRect: CropRect | null;
  createdAt: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QueuedFile {
  id: string;
  file: File;
  role: UploadRole;
  status: 'pending' | 'analyzing' | 'uploading' | 'completed' | 'synced' | 'error';
  progress: number;
  analysis?: FaceAnalysisResult;
  error?: string;
  previewUrl?: string;
}

export interface BucketSummary {
  bucketA: number; // Identity: |yaw| <= 12° (target: 8-10)
  bucketB: number; // Structure: 12° < |yaw| < 70° (target: 6-8, no Dead Zone)
  bucketC: number; // Vibe: happy >= 0.7 (smile shots)
  bucketD: number; // Discard: rejected photos (no face, extreme angle >= 70°)
  total: number;
  usableCount: number; // A + B + C (photos usable for training)
}

export interface UploadAnalysis {
  role: UploadRole;
  summary: BucketSummary;
  needsMoreFrontal: boolean;
  needsMoreSide: boolean;
  canProceed: boolean; // 15+ images
}

// Bucket classification thresholds (Waterfall Logic)
// Note: calculateYawAngle uses 2D coordinates which causes foreshortening distortion
// - Actual 30° head turn may be calculated as 40-45°
// - Thresholds are adjusted higher to compensate for this distortion
// Roll angle thresholds for automatic rotation correction
// Used to detect and correct 90-degree unit rotated images
export const ROLL_THRESHOLDS = {
  NORMAL_MAX: 15,         // |roll| <= 15° = normal (head tilt)
  ROTATION_90_MIN: 45,    // |roll| > 45° = 90° rotation detection start
  ROTATION_90_MAX: 135,   // |roll| < 135° = 90° rotation detection end
  ROTATION_180_MIN: 135,  // |roll| >= 135° = 180° flip detected
} as const;

export const BUCKET_THRESHOLDS = {
  // Bucket A (Identity): |yaw| <= 12° - Core frontal shots for identity learning
  FRONTAL_MAX_YAW: 12,
  // Bucket B (Structure): 12° < |yaw| < 70° - All semi-profile angles before extreme
  // Widened to 65° to accept more side angles (no Dead Zone)
  SIDE_MAX_YAW: 65,
  // Beyond 70° is always rejected (Bucket D) - only extreme profiles excluded
  EXTREME_YAW: 70,
  // Minimum happy expression score for Bucket C (Vibe shots)
  MIN_HAPPY_SCORE: 0.7,
  // Eye Aspect Ratio threshold for eye closure detection
  // Relaxed to 0.1 for Asian eye shapes, side angles, and low angle shots
  MIN_EYE_ASPECT_RATIO: 0.1,
  // Minimum image dimension for quality
  MIN_IMAGE_SIZE: 512,
} as const;

export const BUCKET_TARGETS = {
  A: { min: 8, max: 10, label: '정면' },
  B: { min: 6, max: 8, label: '반측면' },
  C: { min: 0, max: Infinity, label: '스마일' },
  D: { min: 0, max: 0, label: '제외' },
} as const;

// Quality check result
export interface QualityCheckResult {
  passed: boolean;
  issues: QualityIssue[];
}

export type QualityIssue =
  | 'eyes_closed'
  | 'low_resolution'
  | 'no_face'
  | 'negative_expression'
  | 'extreme_angle'
  | 'multiple_faces'
  | 'face_too_small';

// Upload requirements
export const MIN_PHOTOS_PER_ROLE = 15; // Minimum photos per person (groom/bride)
export const RECOMMENDED_PHOTOS_PER_ROLE = 20; // Best quality target per person
export const MIN_TOTAL_PHOTOS = MIN_PHOTOS_PER_ROLE * 2; // Minimum total (30)
export const MIN_IMAGES_TO_PROCEED = MIN_TOTAL_PHOTOS; // Alias for backward compatibility
