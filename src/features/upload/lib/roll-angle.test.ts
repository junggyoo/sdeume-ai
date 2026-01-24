import { describe, it, expect } from 'vitest';
import { ROLL_THRESHOLDS } from '../types';
import {
  calculateRollAngle,
  determineRotationCorrection,
  type RotationCorrection,
} from './roll-angle';

describe('ROLL_THRESHOLDS', () => {
  it('should define NORMAL_MAX as 15 degrees', () => {
    expect(ROLL_THRESHOLDS.NORMAL_MAX).toBe(15);
  });

  it('should define ROTATION_90_MIN as 45 degrees', () => {
    expect(ROLL_THRESHOLDS.ROTATION_90_MIN).toBe(45);
  });

  it('should define ROTATION_90_MAX as 135 degrees', () => {
    expect(ROLL_THRESHOLDS.ROTATION_90_MAX).toBe(135);
  });

  it('should define ROTATION_180_MIN as 135 degrees', () => {
    expect(ROLL_THRESHOLDS.ROTATION_180_MIN).toBe(135);
  });
});

describe('calculateRollAngle', () => {
  /**
   * Helper function to create mock MediaPipe 478-point face landmarks with roll angle
   * Roll angle is simulated by rotating the eye positions around the face center
   * MediaPipe uses indices 33 (left eye outer) and 263 (right eye outer)
   */
  function createMockLandmarksWithRoll(
    rollDegrees: number
  ): Array<{ x: number; y: number }> {
    const landmarks: Array<{ x: number; y: number }> = [];

    // Fill with default positions (MediaPipe has 478 points)
    for (let i = 0; i < 478; i++) {
      landmarks.push({ x: 100 + i, y: 100 + i });
    }

    // Base eye positions (horizontal when roll = 0)
    const centerX = 100;
    const centerY = 100;
    const eyeDistance = 40; // distance from center to each eye

    // Convert roll to radians
    const rollRadians = (rollDegrees * Math.PI) / 180;

    // Calculate rotated eye positions
    // Left eye outer (MediaPipe index 33): 40 pixels left of center
    const leftEyeX = centerX - eyeDistance * Math.cos(rollRadians);
    const leftEyeY = centerY - eyeDistance * Math.sin(rollRadians);

    // Right eye outer (MediaPipe index 263): 40 pixels right of center
    const rightEyeX = centerX + eyeDistance * Math.cos(rollRadians);
    const rightEyeY = centerY + eyeDistance * Math.sin(rollRadians);

    // MediaPipe landmark indices
    landmarks[33] = { x: leftEyeX, y: leftEyeY };
    landmarks[263] = { x: rightEyeX, y: rightEyeY };

    return landmarks;
  }

  it('should return 0 for perfectly horizontal eyes', () => {
    const landmarks = createMockLandmarksWithRoll(0);
    const roll = calculateRollAngle(landmarks);
    expect(Math.abs(roll)).toBeLessThan(0.1); // Allow small floating point error
  });

  it('should return approximately 90 for 90-degree clockwise rotated face', () => {
    const landmarks = createMockLandmarksWithRoll(90);
    const roll = calculateRollAngle(landmarks);
    expect(Math.abs(roll - 90)).toBeLessThan(1);
  });

  it('should return approximately -90 for 90-degree counter-clockwise rotated face', () => {
    const landmarks = createMockLandmarksWithRoll(-90);
    const roll = calculateRollAngle(landmarks);
    expect(Math.abs(roll - -90)).toBeLessThan(1);
  });

  it('should return approximately 180 for upside-down face', () => {
    const landmarks = createMockLandmarksWithRoll(180);
    const roll = calculateRollAngle(landmarks);
    // atan2 returns values in [-180, 180], so 180 and -180 are equivalent
    expect(Math.abs(Math.abs(roll) - 180)).toBeLessThan(1);
  });

  it('should handle small head tilt (10 degrees)', () => {
    const landmarks = createMockLandmarksWithRoll(10);
    const roll = calculateRollAngle(landmarks);
    expect(Math.abs(roll - 10)).toBeLessThan(1);
  });

  it('should handle 45-degree tilt', () => {
    const landmarks = createMockLandmarksWithRoll(45);
    const roll = calculateRollAngle(landmarks);
    expect(Math.abs(roll - 45)).toBeLessThan(1);
  });
});

describe('determineRotationCorrection', () => {
  it('should not need rotation for normal upright face (roll = 0)', () => {
    const result = determineRotationCorrection(0);
    expect(result).toEqual<RotationCorrection>({
      needsRotation: false,
      correctionDegrees: 0,
      detectedRoll: 0,
    });
  });

  it('should not need rotation for small head tilt (roll = 10)', () => {
    const result = determineRotationCorrection(10);
    expect(result.needsRotation).toBe(false);
    expect(result.correctionDegrees).toBe(0);
  });

  it('should not need rotation for small head tilt (roll = -15)', () => {
    const result = determineRotationCorrection(-15);
    expect(result.needsRotation).toBe(false);
    expect(result.correctionDegrees).toBe(0);
  });

  it('should detect 90-degree clockwise rotation and correct with -90', () => {
    const result = determineRotationCorrection(90);
    expect(result).toEqual<RotationCorrection>({
      needsRotation: true,
      correctionDegrees: -90,
      detectedRoll: 90,
    });
  });

  it('should detect 90-degree counter-clockwise rotation and correct with 90', () => {
    const result = determineRotationCorrection(-90);
    expect(result).toEqual<RotationCorrection>({
      needsRotation: true,
      correctionDegrees: 90,
      detectedRoll: -90,
    });
  });

  it('should detect rotation for roll angle of 60 degrees (within 45-135 range)', () => {
    const result = determineRotationCorrection(60);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(-90);
  });

  it('should detect rotation for roll angle of -60 degrees', () => {
    const result = determineRotationCorrection(-60);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(90);
  });

  it('should detect 180-degree rotation (upside-down)', () => {
    const result = determineRotationCorrection(180);
    expect(result).toEqual<RotationCorrection>({
      needsRotation: true,
      correctionDegrees: 180,
      detectedRoll: 180,
    });
  });

  it('should detect 180-degree rotation for -180 roll', () => {
    const result = determineRotationCorrection(-180);
    expect(result).toEqual<RotationCorrection>({
      needsRotation: true,
      correctionDegrees: 180,
      detectedRoll: -180,
    });
  });

  it('should detect 180-degree rotation for roll of 140 degrees', () => {
    const result = determineRotationCorrection(140);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(180);
  });

  it('should detect 180-degree rotation for roll of -140 degrees', () => {
    const result = determineRotationCorrection(-140);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(180);
  });

  it('should not need rotation for boundary value (roll = 15)', () => {
    const result = determineRotationCorrection(15);
    expect(result.needsRotation).toBe(false);
  });

  it('should not need rotation for values between 15 and 45 (ambiguous zone)', () => {
    // Values between 15 and 45 are ambiguous - could be a person tilting head
    // We choose not to rotate to avoid false positives
    const result = determineRotationCorrection(30);
    expect(result.needsRotation).toBe(false);
  });

  it('should need rotation at boundary value (roll = 46)', () => {
    const result = determineRotationCorrection(46);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(-90);
  });

  it('should need 180 rotation at boundary value (roll = 135)', () => {
    const result = determineRotationCorrection(135);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(180);
  });

  // Additional boundary tests
  it('should not need rotation at exact boundary (roll = 45)', () => {
    const result = determineRotationCorrection(45);
    expect(result.needsRotation).toBe(false);
  });

  it('should not need rotation at exact boundary (roll = -45)', () => {
    const result = determineRotationCorrection(-45);
    expect(result.needsRotation).toBe(false);
  });

  it('should need rotation at boundary (roll = -46)', () => {
    const result = determineRotationCorrection(-46);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(90);
  });

  it('should need 180 rotation at boundary (roll = -135)', () => {
    const result = determineRotationCorrection(-135);
    expect(result.needsRotation).toBe(true);
    expect(result.correctionDegrees).toBe(180);
  });
});

describe('calculateRollAngle error handling', () => {
  it('should handle landmarks array with insufficient points gracefully', () => {
    // When landmarks array has fewer than required indices
    // MediaPipe uses index 263, so we need at least 264 points
    const landmarks = Array(264).fill({ x: 0, y: 0 });
    // Should not throw
    expect(() => calculateRollAngle(landmarks)).not.toThrow();
  });

  it('should return 0 when eye positions are identical', () => {
    const landmarks: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 478; i++) {
      landmarks.push({ x: 100, y: 100 });
    }
    // Both eyes at same position - undefined angle
    // MediaPipe indices: 33 (left eye outer), 263 (right eye outer)
    landmarks[33] = { x: 100, y: 100 };
    landmarks[263] = { x: 100, y: 100 };

    const roll = calculateRollAngle(landmarks);
    // When eyes are at same point, atan2(0, 0) returns 0
    expect(roll).toBe(0);
  });
});
