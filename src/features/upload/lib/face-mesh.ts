"use client";

import * as faceapi from "face-api.js";
import type { FaceAnalysisResult, QualityIssue } from "../types";
import { BUCKET_THRESHOLDS } from "../types";
import { classifyBucket } from "./bucket-classifier";

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
			const MODEL_URL = "/models";

			await Promise.all([
				faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
				faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
				faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
			]);

			modelsLoaded = true;
			console.log(
				"[face-api] Models loaded successfully (ssdMobilenetv1, landmark, expression)"
			);
		} catch (error) {
			loadingPromise = null;
			console.error("[face-api] Failed to load models:", error);
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

// Thresholds for valid face detection
const MIN_FACE_SIZE_RATIO = 0.02; // Face should be at least 2% of image area for final classification
const SIGNIFICANT_FACE_SIZE_RATIO = 0.03; // Face should be at least 3% to be counted as "significant"
// Relaxed threshold for filtering out background faces and false positives
const SIGNIFICANT_FACE_CONFIDENCE = 0.2;

/**
 * Analyze a face in an image using face-api.js with Waterfall Logic
 */
export async function analyzeFace(
	imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<FaceAnalysisResult> {
	try {
		await loadModels();

		// Detect face with landmarks and expressions
		// SSD Mobilenet v1 is more accurate for side profile detection than TinyFaceDetector
		const detectorOptions = new faceapi.SsdMobilenetv1Options({
			minConfidence: 0.5, // SSD model handles side profiles well at 0.5 threshold
		});

		// Detect ALL faces first to check for multiple faces
		const allDetections = await faceapi
			.detectAllFaces(imageElement, detectorOptions)
			.withFaceLandmarks()
			.withFaceExpressions();

		// No face detected
		if (allDetections.length === 0) {
			console.log("[face-api] No face detected");
			const noFaceResult = classifyBucket(0, 0, false, false);
			return {
				faceDetected: false,
				yawAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: noFaceResult.bucket,
				confidence: 0,
				qualityIssues: noFaceResult.qualityIssues,
				isUsable: false,
				rejectionReason: noFaceResult.rejectionReason,
			};
		}

		// Calculate face metrics
		const imageWidth =
			imageElement.width || (imageElement as HTMLImageElement).naturalWidth;
		const imageHeight =
			imageElement.height || (imageElement as HTMLImageElement).naturalHeight;
		const imageArea = imageWidth * imageHeight;

		const facesWithMetrics = allDetections.map((d) => ({
			detection: d,
			faceArea: d.detection.box.width * d.detection.box.height,
			faceRatio: (d.detection.box.width * d.detection.box.height) / imageArea,
			confidence: d.detection.score,
		}));

		// Filter for SIGNIFICANT faces: high confidence AND large enough size
		// This filters out background posters, small faces, and false positives
		const significantFaces = facesWithMetrics.filter(
			(f) =>
				f.confidence >= SIGNIFICANT_FACE_CONFIDENCE &&
				f.faceRatio >= SIGNIFICANT_FACE_SIZE_RATIO
		);

		console.log(
			`[face-api] Detected ${allDetections.length} face(s), ` +
				`${
					significantFaces.length
				} significant (conf≥${SIGNIFICANT_FACE_CONFIDENCE}, size≥${
					SIGNIFICANT_FACE_SIZE_RATIO * 100
				}%)`
		);

		// Check for multiple significant faces (not suitable for LoRA training)
		if (significantFaces.length > 1) {
			console.log(
				`[face-api] Multiple significant faces detected: ${significantFaces.length}`
			);
			return {
				faceDetected: true,
				yawAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: 0,
				qualityIssues: ["multiple_faces"],
				isUsable: false,
				rejectionReason: "여러 얼굴 감지",
			};
		}

		// No significant face found
		if (significantFaces.length === 0) {
			console.log(
				"[face-api] No significant face detected (low confidence or too small)"
			);
			return {
				faceDetected: false,
				yawAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: 0,
				qualityIssues: ["no_face"],
				isUsable: false,
				rejectionReason: "얼굴 미감지",
			};
		}

		// Use the single significant face
		const largestFace = significantFaces[0];

		const detection = largestFace.detection;

		// Check if face is too small relative to image (e.g., full body shot)
		if (largestFace.faceRatio < MIN_FACE_SIZE_RATIO) {
			console.log(
				`[face-api] Face too small: ${(largestFace.faceRatio * 100).toFixed(
					2
				)}% of image`
			);
			return {
				faceDetected: true,
				yawAngle: 0,
				smileScore: 0,
				eyesOpen: false,
				bucket: "D",
				confidence: detection.detection.score,
				qualityIssues: ["face_too_small"],
				isUsable: false,
				rejectionReason: "얼굴이 너무 작음",
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

		// Classify using Waterfall Logic (imported from bucket-classifier)
		const classification = classifyBucket(yawAngle, happyScore, eyesOpen, true);

		console.log(
			`[face-api] Face detected - yaw: ${yawAngle}°, happy: ${(
				happyScore * 100
			).toFixed(1)}%, ` +
				`EAR: ${eyeAspectRatio.toFixed(2)}, faceRatio: ${(
					largestFace.faceRatio * 100
				).toFixed(1)}%, ` +
				`bucket: ${classification.bucket}, usable: ${classification.isUsable}`
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
			rejectionReason: classification.rejectionReason,
		};
	} catch (error) {
		console.error("[face-api] Analysis error:", error);
		const errorResult = classifyBucket(0, 0, false, false);
		return {
			faceDetected: false,
			yawAngle: 0,
			smileScore: 0,
			eyesOpen: false,
			bucket: errorResult.bucket,
			confidence: 0,
			qualityIssues: errorResult.qualityIssues,
			isUsable: false,
			rejectionReason: errorResult.rejectionReason,
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
