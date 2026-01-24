"use client";

import { FilesetResolver, FaceLandmarker, type NormalizedLandmark, type Category } from "@mediapipe/tasks-vision";
import type { FaceAnalysisResult, QualityIssue } from "../types";
import { BUCKET_THRESHOLDS } from "../types";
import { classifyBucket } from "./bucket-classifier";
import { calculateRollAngle, determineRotationCorrection, type RotationCorrection } from "./roll-angle";

// MediaPipe landmark indices (478-point mesh)
// Nose tip for yaw calculation
const MP_NOSE_TIP = 4;
// Eye outer corners for yaw and roll calculation
const MP_LEFT_EYE_OUTER = 33;
const MP_RIGHT_EYE_OUTER = 263;

let faceLandmarker: FaceLandmarker | null = null;
let loadingPromise: Promise<void> | null = null;

/**
 * Load MediaPipe FaceLandmarker models
 */
async function loadModels(): Promise<void> {
	if (faceLandmarker) {
		return;
	}

	if (loadingPromise) {
		return loadingPromise;
	}

	loadingPromise = (async () => {
		try {
			const vision = await FilesetResolver.forVisionTasks(
				"/models/mediapipe/wasm"
			);

			faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: "/models/mediapipe/face_landmarker.task",
					delegate: "GPU",
				},
				runningMode: "IMAGE",
				numFaces: 5,
				outputFaceBlendshapes: true,
			});
		} catch (error) {
			loadingPromise = null;
			console.error("[MediaPipe] Failed to load models:", error);
			throw error;
		}
	})();

	return loadingPromise;
}

/**
 * Calculate smile score from MediaPipe blendshapes
 * Uses mouthSmileLeft and mouthSmileRight blendshapes
 */
function calculateSmileScore(blendshapes: Category[]): number {
	const smileLeft = blendshapes.find(b => b.categoryName === "mouthSmileLeft")?.score ?? 0;
	const smileRight = blendshapes.find(b => b.categoryName === "mouthSmileRight")?.score ?? 0;
	return (smileLeft + smileRight) / 2;
}

/**
 * Detect if eyes are open using MediaPipe blendshapes
 * Uses eyeBlinkLeft and eyeBlinkRight blendshapes
 * Returns true if eyes are open (low blink score)
 */
function areEyesOpen(blendshapes: Category[]): boolean {
	const blinkLeft = blendshapes.find(b => b.categoryName === "eyeBlinkLeft")?.score ?? 0;
	const blinkRight = blendshapes.find(b => b.categoryName === "eyeBlinkRight")?.score ?? 0;
	const avgBlink = (blinkLeft + blinkRight) / 2;
	// Eyes are open if blink score is below 0.5
	return avgBlink < 0.5;
}

/**
 * Calculate yaw angle from MediaPipe 478-point landmarks
 * Uses nose tip (4) and eye outer corners (33, 263)
 */
function calculateYawAngle(landmarks: NormalizedLandmark[]): number {
	const noseTip = landmarks[MP_NOSE_TIP];
	const leftEye = landmarks[MP_LEFT_EYE_OUTER];
	const rightEye = landmarks[MP_RIGHT_EYE_OUTER];

	if (!noseTip || !leftEye || !rightEye) {
		return 0;
	}

	const eyeMidX = (leftEye.x + rightEye.x) / 2;
	const noseDiff = noseTip.x - eyeMidX;
	const eyeDistance = Math.abs(rightEye.x - leftEye.x);

	if (eyeDistance === 0) {
		return 0;
	}

	// Factor adjusted for 478-point model geometry
	const normalizedDiff = noseDiff / (eyeDistance * 0.4);
	const yawAngle = Math.atan(normalizedDiff) * (180 / Math.PI);

	return Math.round(yawAngle * 10) / 10;
}

/**
 * Calculate roll angle from MediaPipe landmarks
 * Uses eye outer corners (33, 263) for MediaPipe
 */
function calculateRollAngleMP(landmarks: NormalizedLandmark[]): number {
	const leftEyeOuter = landmarks[MP_LEFT_EYE_OUTER];
	const rightEyeOuter = landmarks[MP_RIGHT_EYE_OUTER];

	if (!leftEyeOuter || !rightEyeOuter) {
		return 0;
	}

	const dx = rightEyeOuter.x - leftEyeOuter.x;
	const dy = rightEyeOuter.y - leftEyeOuter.y;

	const angleRadians = Math.atan2(dy, dx);
	const angleDegrees = angleRadians * (180 / Math.PI);

	return Math.round(angleDegrees * 10) / 10;
}

/**
 * Calculate bounding box from landmarks (normalized 0-1 coordinates)
 * Returns box in pixel coordinates based on image dimensions
 */
function calculateBoundingBox(
	landmarks: NormalizedLandmark[],
	imageWidth: number,
	imageHeight: number
): { x: number; y: number; width: number; height: number } {
	let minX = 1, maxX = 0, minY = 1, maxY = 0;

	for (const landmark of landmarks) {
		if (landmark.x < minX) minX = landmark.x;
		if (landmark.x > maxX) maxX = landmark.x;
		if (landmark.y < minY) minY = landmark.y;
		if (landmark.y > maxY) maxY = landmark.y;
	}

	return {
		x: Math.round(minX * imageWidth),
		y: Math.round(minY * imageHeight),
		width: Math.round((maxX - minX) * imageWidth),
		height: Math.round((maxY - minY) * imageHeight),
	};
}

// Thresholds for valid face detection
const MIN_FACE_SIZE_RATIO = 0.02; // Face should be at least 2% of image area for final classification
const SIGNIFICANT_FACE_SIZE_RATIO = 0.03; // Face should be at least 3% to be counted as "significant"

/**
 * Analyze a face in an image using MediaPipe FaceLandmarker
 * Includes auto-rotation fallback: if no face is detected, tries rotations to find the correct orientation
 */
export async function analyzeFace(
	imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<FaceAnalysisResult> {
	try {
		await loadModels();

		if (!faceLandmarker) {
			throw new Error("FaceLandmarker not initialized");
		}

		// Detect faces with landmarks and blendshapes
		let result = faceLandmarker.detect(imageElement);

		let appliedRotation: 0 | 90 | -90 | 180 = 0;
		let rotatedCanvas: HTMLCanvasElement | null = null;

		// Get image dimensions
		let imageWidth = imageElement.width || (imageElement as HTMLImageElement).naturalWidth;
		let imageHeight = imageElement.height || (imageElement as HTMLImageElement).naturalHeight;

		// Fallback: If no face detected and it's an HTMLImageElement, try rotation detection
		if (result.faceLandmarks.length === 0 && imageElement instanceof HTMLImageElement) {
			console.log("[MediaPipe] No face detected, trying rotation fallback...");

			const rotationResult = await detectRotationByTrial(imageElement);

			if (rotationResult && rotationResult.needsRotation) {
				console.log(`[MediaPipe] Rotation needed: ${rotationResult.correctionDegrees}°`);

				// Create rotated canvas
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (ctx) {
					const { width, height } = imageElement;

					// Adjust canvas size for 90° rotations
					if (Math.abs(rotationResult.correctionDegrees) === 90) {
						canvas.width = height;
						canvas.height = width;
					} else {
						canvas.width = width;
						canvas.height = height;
					}

					// Apply rotation transform
					ctx.translate(canvas.width / 2, canvas.height / 2);
					ctx.rotate((rotationResult.correctionDegrees * Math.PI) / 180);
					ctx.drawImage(imageElement, -width / 2, -height / 2);

					// Detect faces in rotated canvas
					result = faceLandmarker.detect(canvas);

					if (result.faceLandmarks.length > 0) {
						appliedRotation = rotationResult.correctionDegrees;
						rotatedCanvas = canvas;
						imageWidth = canvas.width;
						imageHeight = canvas.height;
						console.log(`[MediaPipe] Face detected after ${appliedRotation}° rotation!`);
					}
				}
			}
		}

		// No face detected even after rotation fallback
		if (result.faceLandmarks.length === 0) {
			const noFaceResult = classifyBucket(0, 0, false, false);
			return {
				faceDetected: false,
				yawAngle: 0,
				rollAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: noFaceResult.bucket,
				confidence: 0,
				qualityIssues: noFaceResult.qualityIssues,
				isUsable: false,
				rejectionReason: noFaceResult.rejectionReason,
				appliedRotation: 0,
			};
		}

		const imageArea = imageWidth * imageHeight;

		// Calculate metrics for each detected face
		const facesWithMetrics = result.faceLandmarks.map((landmarks, index) => {
			const box = calculateBoundingBox(landmarks, imageWidth, imageHeight);
			const faceArea = box.width * box.height;
			// Access .categories from the Classifications object
			const blendshapes = result.faceBlendshapes?.[index]?.categories ?? [];
			return {
				landmarks,
				blendshapes,
				faceArea,
				faceRatio: faceArea / imageArea,
				box,
			};
		});

		// Filter for SIGNIFICANT faces: large enough size
		// MediaPipe doesn't provide confidence scores per face like face-api.js
		const significantFaces = facesWithMetrics.filter(
			(f) => f.faceRatio >= SIGNIFICANT_FACE_SIZE_RATIO
		);

		// Check for multiple significant faces (not suitable for LoRA training)
		if (significantFaces.length > 1) {
			return {
				faceDetected: true,
				yawAngle: 0,
				rollAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: 0,
				qualityIssues: ["multiple_faces"],
				isUsable: false,
				rejectionReason: "여러 얼굴 감지",
				appliedRotation,
			};
		}

		// No significant face found
		if (significantFaces.length === 0) {
			return {
				faceDetected: false,
				yawAngle: 0,
				rollAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: 0,
				qualityIssues: ["no_face"],
				isUsable: false,
				rejectionReason: "얼굴 미감지",
				appliedRotation,
			};
		}

		// Use the single significant face
		const face = significantFaces[0];

		// Check if face is too small relative to image (e.g., full body shot)
		if (face.faceRatio < MIN_FACE_SIZE_RATIO) {
			return {
				faceDetected: true,
				yawAngle: 0,
				rollAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: 0.5, // Estimated confidence
				qualityIssues: ["face_too_small"],
				isUsable: false,
				rejectionReason: "얼굴이 너무 작음",
				appliedRotation,
			};
		}

		// Calculate metrics
		const yawAngle = calculateYawAngle(face.landmarks);
		const rollAngle = calculateRollAngleMP(face.landmarks);
		const smileScore = calculateSmileScore(face.blendshapes);
		const eyesOpen = areEyesOpen(face.blendshapes);

		// Classify using Waterfall Logic
		const classification = classifyBucket(yawAngle, smileScore, eyesOpen, true);

		return {
			faceDetected: true,
			yawAngle,
			rollAngle,
			smileScore,
			eyesOpen,
			bucket: classification.bucket,
			confidence: 0.9, // MediaPipe doesn't provide confidence, use high default
			qualityIssues: classification.qualityIssues,
			isUsable: classification.isUsable,
			rejectionReason: classification.rejectionReason,
			appliedRotation,
			faceBox: face.box,
			imageWidth,
			imageHeight,
		};
	} catch (error) {
		console.error("[MediaPipe] Analysis error:", error);
		const errorResult = classifyBucket(0, 0, false, false);
		return {
			faceDetected: false,
			yawAngle: 0,
			rollAngle: 0,
			smileScore: 0,
			eyesOpen: false,
			bucket: errorResult.bucket,
			confidence: 0,
			qualityIssues: errorResult.qualityIssues,
			isUsable: false,
			rejectionReason: errorResult.rejectionReason,
			appliedRotation: 0,
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
				qualityIssues.push("low_resolution");
			}

			try {
				const result = await analyzeFace(img);

				// Merge quality issues
				if (qualityIssues.length > 0) {
					result.qualityIssues = [
						...new Set([...result.qualityIssues, ...qualityIssues]),
					];
					if (qualityIssues.includes("low_resolution")) {
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
			reject(new Error("Failed to load image"));
		};

		img.crossOrigin = "anonymous";
		img.src = url;
	});
}

/**
 * Result of trying to detect a face at a specific rotation
 */
interface RotationDetectionResult {
	detected: boolean;
	faceSize: number; // Face size as quality indicator
	yawAngle: number; // Lower yaw = more frontal = better quality
	isUpsideDown: boolean; // True if face is detected but upside down
}

/**
 * Try to detect a face at a specific rotation
 * Returns detection status and quality metrics
 */
async function tryDetectFaceAtRotation(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	rotation: 0 | 90 | 180 | 270
): Promise<RotationDetectionResult> {
	const { width, height } = img;

	// Set canvas size based on rotation
	if (rotation === 90 || rotation === 270) {
		canvas.width = height;
		canvas.height = width;
	} else {
		canvas.width = width;
		canvas.height = height;
	}

	// Clear and apply rotation transform
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	switch (rotation) {
		case 90:
			ctx.translate(height, 0);
			ctx.rotate(Math.PI / 2);
			break;
		case 180:
			ctx.translate(width, height);
			ctx.rotate(Math.PI);
			break;
		case 270:
			ctx.translate(0, width);
			ctx.rotate(-Math.PI / 2);
			break;
		default:
			// 0 degrees - no transform needed
			break;
	}

	ctx.drawImage(img, 0, 0);

	// Reset transform for next use
	ctx.setTransform(1, 0, 0, 1, 0, 0);

	// Try to detect face
	if (!faceLandmarker) {
		return { detected: false, faceSize: 0, yawAngle: 90, isUpsideDown: false };
	}

	const result = faceLandmarker.detect(canvas);

	if (result.faceLandmarks.length === 0) {
		return { detected: false, faceSize: 0, yawAngle: 90, isUpsideDown: false };
	}

	// Calculate quality metrics for the first face
	const landmarks = result.faceLandmarks[0];
	const box = calculateBoundingBox(landmarks, canvas.width, canvas.height);
	const faceSize = box.width * box.height;
	const yawAngle = Math.abs(calculateYawAngle(landmarks));

	// Check if face is upside down by comparing left and right eye X coordinates
	// MediaPipe assigns landmarks based on IMAGE position (not anatomical):
	//   - Landmark 33 ("left eye") = the eye on the LEFT side of the image (lower X)
	//   - Landmark 263 ("right eye") = the eye on the RIGHT side of the image (higher X)
	// In a NORMAL upright face:
	//   - Left eye (33) is on the left side of image → lower X
	//   - Right eye (263) is on the right side of image → higher X
	//   - So: leftEyeOuter.x < rightEyeOuter.x is NORMAL
	// In an UPSIDE-DOWN face:
	//   - The eyes are horizontally flipped
	//   - Left eye (33) ends up on the right side → higher X
	//   - Right eye (263) ends up on the left side → lower X
	//   - So: leftEyeOuter.x > rightEyeOuter.x is UPSIDE DOWN
	const leftEyeOuter = landmarks[33];
	const rightEyeOuter = landmarks[263];
	const isUpsideDown = leftEyeOuter.x > rightEyeOuter.x;

	return { detected: true, faceSize, yawAngle, isUpsideDown };
}

/**
 * Detect the correct rotation by trying multiple angles and comparing quality metrics.
 * MediaPipe can detect faces at various angles, so we use face size and yaw angle
 * to determine the best rotation.
 *
 * Returns the correction needed to fix the image orientation.
 */
export async function detectRotationByTrial(
	imageElement: HTMLImageElement
): Promise<RotationCorrection | null> {
	try {
		await loadModels();

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			console.error("[MediaPipe] Failed to get canvas context");
			return null;
		}

		// Rotations to try: 0° (original), then 90°, 270°, 180°
		// correctionNeeded = the rotation to apply to make the image upright
		// If face is detected best at testRotation X, we need to rotate the original by X
		const rotationsToTry: Array<{
			testRotation: 0 | 90 | 180 | 270;
			correctionNeeded: 0 | 90 | -90 | 180;
		}> = [
			{ testRotation: 0, correctionNeeded: 0 },
			{ testRotation: 90, correctionNeeded: 90 },    // Face detected at 90° CW → rotate original 90° CW
			{ testRotation: 270, correctionNeeded: -90 },  // Face detected at 270° CW (90° CCW) → rotate original 90° CCW
			{ testRotation: 180, correctionNeeded: 180 },
		];

		console.log(`[MediaPipe] Starting rotation detection for image ${imageElement.width}x${imageElement.height}`);

		// Collect results from rotations
		// Note: We must try all rotations because MediaPipe can detect upside-down faces
		const results: Array<{
			testRotation: 0 | 90 | 180 | 270;
			correctionNeeded: 0 | 90 | -90 | 180;
			detected: boolean;
			faceSize: number;
			yawAngle: number;
			isUpsideDown: boolean;
		}> = [];

		for (const { testRotation, correctionNeeded } of rotationsToTry) {
			console.log(`[MediaPipe] Trying ${testRotation}° rotation...`);
			const { detected, faceSize, yawAngle, isUpsideDown } = await tryDetectFaceAtRotation(
				canvas,
				ctx,
				imageElement,
				testRotation
			);

			const statusMsg = detected
				? `DETECTED (size: ${faceSize}, yaw: ${yawAngle}°${isUpsideDown ? ', UPSIDE DOWN' : ''})`
				: "not detected";
			console.log(`[MediaPipe] ${testRotation}° rotation: ${statusMsg}`);

			results.push({
				testRotation,
				correctionNeeded,
				detected,
				faceSize,
				yawAngle,
				isUpsideDown,
			});

			// Early return optimization: Only if face is upright (not upside down) and frontal
			// Skip early return if face is upside down - need to try other rotations
			if (testRotation === 0 && detected && !isUpsideDown && yawAngle < 30) {
				console.log(`[MediaPipe] ✅ Early return: Face detected at 0° with good quality (yaw: ${yawAngle}°)`);
				return {
					needsRotation: false,
					correctionDegrees: 0,
					detectedRoll: 0,
				};
			}
		}

		// Filter detected results - only consider upright faces (not upside down)
		const uprightResults = results.filter(r => r.detected && !r.isUpsideDown);
		const allDetectedResults = results.filter(r => r.detected);

		// No upright face detected at any rotation
		if (uprightResults.length === 0) {
			// If faces were detected but all upside down, log this
			if (allDetectedResults.length > 0) {
				console.log("[MediaPipe] All detected faces are upside down - this shouldn't happen");
			}
			console.log("[MediaPipe] No upright face detected at any rotation");
			return null;
		}

		// Find the best rotation from upright faces only:
		// 1. Prefer larger face size (better detection)
		// 2. Prefer lower yaw angle (more frontal)
		// Quality score = faceSize / (1 + yawAngle/45) - larger face, lower yaw = higher score
		const scoredResults = uprightResults.map(r => ({
			...r,
			qualityScore: r.faceSize / (1 + r.yawAngle / 45),
		}));

		const bestResult = scoredResults.reduce((best, current) =>
			current.qualityScore > best.qualityScore ? current : best
		);

		// Check 0° result
		const zeroRotationResult = scoredResults.find(r => r.testRotation === 0);

		console.log(`[MediaPipe] Best quality at ${bestResult.testRotation}° (score: ${bestResult.qualityScore.toFixed(2)})`);

		// Decision logic:
		// 1. If 0° has the best quality score, no rotation needed
		// 2. If 0° didn't detect face but another rotation did, rotate
		// 3. If another rotation has better quality (>15% improvement) OR much better yaw angle, rotate

		if (bestResult.correctionNeeded === 0) {
			console.log(`[MediaPipe] ✅ No rotation needed (0° is best)`);
			return {
				needsRotation: false,
				correctionDegrees: 0,
				detectedRoll: 0,
			};
		}

		// Check if we should rotate
		// Lower threshold from 1.5 to 1.15 (15% quality improvement is enough)
		// Also rotate if 0° has high yaw (>45°) but best has lower yaw (more frontal)
		const zeroQuality = zeroRotationResult?.qualityScore ?? 0;
		const zeroYaw = zeroRotationResult?.yawAngle ?? 90;

		const hasQualityImprovement = bestResult.qualityScore > zeroQuality * 1.15;
		const hasYawImprovement = zeroYaw > 45 && bestResult.yawAngle < zeroYaw * 0.7; // 30% better yaw
		const noFaceAtZero = !zeroRotationResult || !zeroRotationResult.detected;

		const shouldRotate = noFaceAtZero || hasQualityImprovement || hasYawImprovement;

		if (!shouldRotate) {
			console.log(`[MediaPipe] ✅ No rotation needed (quality: ${zeroQuality.toFixed(0)} vs ${bestResult.qualityScore.toFixed(0)}, yaw: ${zeroYaw.toFixed(1)}° vs ${bestResult.yawAngle.toFixed(1)}°)`);
			return {
				needsRotation: false,
				correctionDegrees: 0,
				detectedRoll: 0,
			};
		}

		console.log(`[MediaPipe] ✅ Rotation needed: correction ${bestResult.correctionNeeded}°`);

		return {
			needsRotation: true,
			correctionDegrees: bestResult.correctionNeeded,
			detectedRoll: bestResult.testRotation,
		};
	} catch (error) {
		console.error("[MediaPipe] Rotation detection error:", error);
		return null;
	}
}

/**
 * Detect rotation from a File by trying multiple angles
 */
export async function detectRotationFromFile(
	file: File
): Promise<RotationCorrection | null> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = async () => {
			URL.revokeObjectURL(url);
			try {
				const result = await detectRotationByTrial(img);
				resolve(result);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.crossOrigin = "anonymous";
		img.src = url;
	});
}

/**
 * Lightweight face analysis for rotation detection only (roll-angle based)
 * NOTE: For 90-degree rotated images, use detectRotationByTrial instead.
 */
export async function analyzeForRotation(
	imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<RotationCorrection | null> {
	try {
		await loadModels();

		if (!faceLandmarker) {
			return null;
		}

		const result = faceLandmarker.detect(imageElement);

		if (result.faceLandmarks.length === 0) {
			return null;
		}

		// Use the first face
		const landmarks = result.faceLandmarks[0];
		const rollAngle = calculateRollAngleMP(landmarks);

		return determineRotationCorrection(rollAngle);
	} catch (error) {
		console.error("[MediaPipe] Rotation analysis error:", error);
		return null;
	}
}

/**
 * Analyze face from a File for rotation detection only
 * @deprecated Use detectRotationFromFile instead for better 90-degree detection
 */
export async function analyzeForRotationFromFile(
	file: File
): Promise<RotationCorrection | null> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = async () => {
			URL.revokeObjectURL(url);
			try {
				const result = await analyzeForRotation(img);
				resolve(result);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.crossOrigin = "anonymous";
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
 * Cleanup MediaPipe resources
 */
export function cleanupFaceMesh(): void {
	if (faceLandmarker) {
		faceLandmarker.close();
		faceLandmarker = null;
		loadingPromise = null;
	}
}
