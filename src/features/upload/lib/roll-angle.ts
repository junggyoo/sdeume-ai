import { ROLL_THRESHOLDS } from '../types';

/**
 * Result of rotation correction analysis
 */
export interface RotationCorrection {
  needsRotation: boolean;
  correctionDegrees: 0 | 90 | -90 | 180;
  detectedRoll: number;
}

/**
 * Calculate roll angle from 68 face landmarks
 * Uses left eye outer corner (36) and right eye outer corner (45)
 * Returns angle in degrees (-180 to 180)
 *
 * Roll angle indicates how much the face/image is rotated:
 * - 0°: Face is upright (eyes horizontal)
 * - 90°: Face is rotated 90° clockwise (right ear up)
 * - -90°: Face is rotated 90° counter-clockwise (left ear up)
 * - ±180°: Face is upside down
 */
export function calculateRollAngle(
  landmarks: Array<{ x: number; y: number }>
): number {
  // Get eye outer corner positions
  const leftEyeOuter = landmarks[36];
  const rightEyeOuter = landmarks[45];

  // Handle edge case where eyes are at the same position
  if (!leftEyeOuter || !rightEyeOuter) {
    return 0;
  }

  const dx = rightEyeOuter.x - leftEyeOuter.x;
  const dy = rightEyeOuter.y - leftEyeOuter.y;

  // atan2 returns angle in radians from -PI to PI
  const angleRadians = Math.atan2(dy, dx);
  const angleDegrees = angleRadians * (180 / Math.PI);

  return Math.round(angleDegrees * 10) / 10;
}

/**
 * Determine if the image needs rotation correction based on roll angle
 *
 * Logic:
 * - |roll| <= 15°: Normal head tilt, no rotation needed
 * - 15° < |roll| <= 45°: Ambiguous zone (could be intentional tilt), no rotation
 * - 45° < |roll| < 135°: 90° rotation detected, needs correction
 * - |roll| >= 135°: 180° rotation detected (upside down)
 */
export function determineRotationCorrection(
  rollAngle: number
): RotationCorrection {
  const absRoll = Math.abs(rollAngle);

  // Normal range: no rotation needed
  if (absRoll <= ROLL_THRESHOLDS.NORMAL_MAX) {
    return {
      needsRotation: false,
      correctionDegrees: 0,
      detectedRoll: rollAngle,
    };
  }

  // Ambiguous zone: might be intentional head tilt, don't rotate
  if (absRoll <= ROLL_THRESHOLDS.ROTATION_90_MIN) {
    return {
      needsRotation: false,
      correctionDegrees: 0,
      detectedRoll: rollAngle,
    };
  }

  // 180° rotation (upside down)
  if (absRoll >= ROLL_THRESHOLDS.ROTATION_180_MIN) {
    return {
      needsRotation: true,
      correctionDegrees: 180,
      detectedRoll: rollAngle,
    };
  }

  // 90° rotation detected (between 45° and 135°)
  // Positive roll = clockwise rotation = need counter-clockwise correction (-90)
  // Negative roll = counter-clockwise rotation = need clockwise correction (90)
  return {
    needsRotation: true,
    correctionDegrees: rollAngle > 0 ? -90 : 90,
    detectedRoll: rollAngle,
  };
}
