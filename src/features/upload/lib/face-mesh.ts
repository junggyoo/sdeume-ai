'use client';

import * as faceapi from 'face-api.js';
import type { FaceAnalysisResult, QualityIssue } from '../types';
import { BUCKET_THRESHOLDS } from '../types';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load face-api.js models from public folder
 */
async function loadModels(): Promise<void> {
  if (modelsLoaded) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const MODEL_URL = '/models';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      modelsLoaded = true;
      console.log('[face-api] Models loaded successfully (detector, landmark, expression)');
    } catch (error) {
      loadingPromise = null;
      console.error('[face-api] Failed to load models:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Calculate Eye Aspect Ratio (EAR) to detect eye closure
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * Returns average of both eyes
 */
function calculateEyeAspectRatio(landmarks: faceapi.FaceLandmarks68): number {
  const positions = landmarks.positions;

  // Left eye landmarks (36-41)
  const leftEye = {
    p1: positions[36], // outer corner
    p2: positions[37], // upper outer
    p3: positions[38], // upper inner
    p4: positions[39], // inner corner
    p5: positions[40], // lower inner
    p6: positions[41], // lower outer
  };

  // Right eye landmarks (42-47)
  const rightEye = {
    p1: positions[42],
    p2: positions[43],
    p3: positions[44],
    p4: positions[45],
    p5: positions[46],
    p6: positions[47],
  };

  const calcEAR = (eye: typeof leftEye): number => {
    const verticalA = Math.sqrt(
      Math.pow(eye.p2.x - eye.p6.x, 2) + Math.pow(eye.p2.y - eye.p6.y, 2)
    );
    const verticalB = Math.sqrt(
      Math.pow(eye.p3.x - eye.p5.x, 2) + Math.pow(eye.p3.y - eye.p5.y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(eye.p1.x - eye.p4.x, 2) + Math.pow(eye.p1.y - eye.p4.y, 2)
    );

    if (horizontal === 0) return 0;
    return (verticalA + verticalB) / (2 * horizontal);
  };

  const leftEAR = calcEAR(leftEye);
  const rightEAR = calcEAR(rightEye);

  return (leftEAR + rightEAR) / 2;
}

/**
 * Calculate yaw angle from 68 face landmarks
 * Uses nose tip (30) and eye outer corners (36, 45)
 */
function calculateYawAngle(landmarks: faceapi.FaceLandmarks68): number {
  const positions = landmarks.positions;

  const noseTip = positions[30];
  const leftEyeOuter = positions[36];
  const rightEyeOuter = positions[45];

  const eyeMidpointX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const noseDiff = noseTip.x - eyeMidpointX;
  const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);

  // Factor adjusted for 68-point model geometry
  const normalizedDiff = noseDiff / (eyeDistance * 0.4);
  const yawAngle = Math.atan(normalizedDiff) * (180 / Math.PI);

  return Math.round(yawAngle * 10) / 10;
}

/**
 * Waterfall Logic: Classify face into bucket
 *
 * Step 0: Quality Filter (eyes closed, extreme angle, negative expression)
 * Step 1: Angle Classification (A: frontal, B: semi-profile)
 * Step 2: Smile Classification (C: happy expression regardless of angle)
 */
function classifyWithWaterfallLogic(
  yawAngle: number,
  happyScore: number,
  eyesOpen: boolean,
  faceDetected: boolean
): { bucket: 'A' | 'B' | 'C'; qualityIssues: QualityIssue[]; isUsable: boolean } {
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

  // Step 1: Angle-based classification (if angle is good)
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

  // Angle too extreme and no good expression - not ideal but classify as C
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
 * Analyze a face in an image using face-api.js with Waterfall Logic
 */
export async function analyzeFace(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<FaceAnalysisResult> {
  try {
    await loadModels();

    // Detect face with landmarks and expressions
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detection) {
      console.log('[face-api] No face detected');
      return {
        faceDetected: false,
        yawAngle: 0,
        smileScore: 0,
        eyesOpen: false,
        bucket: 'C',
        confidence: 0,
        qualityIssues: ['no_face'],
        isUsable: false,
      };
    }

    const landmarks = detection.landmarks;
    const expressions = detection.expressions;
    const confidence = detection.detection.score;

    // Calculate metrics
    const yawAngle = calculateYawAngle(landmarks);
    const eyeAspectRatio = calculateEyeAspectRatio(landmarks);
    const eyesOpen = eyeAspectRatio >= BUCKET_THRESHOLDS.MIN_EYE_ASPECT_RATIO;
    const happyScore = expressions.happy;

    // Classify using Waterfall Logic
    const classification = classifyWithWaterfallLogic(
      yawAngle,
      happyScore,
      eyesOpen,
      true
    );

    console.log(
      `[face-api] Face detected - yaw: ${yawAngle}°, happy: ${(happyScore * 100).toFixed(1)}%, ` +
        `EAR: ${eyeAspectRatio.toFixed(2)}, bucket: ${classification.bucket}, ` +
        `usable: ${classification.isUsable}`
    );

    return {
      faceDetected: true,
      yawAngle,
      smileScore: happyScore,
      eyesOpen,
      bucket: classification.bucket,
      confidence,
      qualityIssues: classification.qualityIssues,
      isUsable: classification.isUsable,
    };
  } catch (error) {
    console.error('[face-api] Analysis error:', error);
    return {
      faceDetected: false,
      yawAngle: 0,
      smileScore: 0,
      eyesOpen: false,
      bucket: 'C',
      confidence: 0,
      qualityIssues: ['no_face'],
      isUsable: false,
    };
  }
}

/**
 * Analyze face from a File object
 */
export async function analyzeFaceFromFile(
  file: File
): Promise<FaceAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      // Check image size (quality filter)
      const qualityIssues: QualityIssue[] = [];
      if (
        img.width < BUCKET_THRESHOLDS.MIN_IMAGE_SIZE ||
        img.height < BUCKET_THRESHOLDS.MIN_IMAGE_SIZE
      ) {
        qualityIssues.push('low_resolution');
      }

      try {
        const result = await analyzeFace(img);

        // Merge quality issues
        if (qualityIssues.length > 0) {
          result.qualityIssues = [...new Set([...result.qualityIssues, ...qualityIssues])];
          if (qualityIssues.includes('low_resolution')) {
            result.isUsable = false;
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Preload models (can be called early to reduce first-analysis latency)
 */
export async function preloadFaceModels(): Promise<void> {
  await loadModels();
}

/**
 * Cleanup (no-op for face-api.js, kept for API compatibility)
 */
export function cleanupFaceMesh(): void {
  // face-api.js doesn't require explicit cleanup
}
