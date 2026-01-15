// src/features/upload/lib/bucket-classifier.ts 최상단
console.log(">>> [DEBUG] NEW LOGIC LOADED: SIDE_MAX=65, NO DEAD ZONE"); // 이 로그가 안 뜨면 구버전 코드입니다.

import {
	type BucketType,
	type FaceAnalysisResult,
	type QualityIssue,
	BUCKET_THRESHOLDS,
	BUCKET_TARGETS,
} from "../types";

/**
 * 3-Bucket Waterfall Logic: Classify face into bucket (No Dead Zone)
 *
 * Step 1 (Critical Filter): Reject unusable photos → D
 *   - No face detected
 *   - Extreme angle (|yaw| >= 70°) - only true back-of-head shots
 *
 * Step 2 (Vibe Check): Smile detection → C
 *   - happyScore >= 0.7 → C (regardless of angle)
 *
 * Step 3 (Geometry Check): Angle-based classification
 *   - |yaw| <= 12° → A (frontal)
 *   - 12° < |yaw| < 70° → B (semi-profile, all remaining angles)
 *
 * Note: No Dead Zone - all angles below 70° are accepted as B bucket
 */
export function classifyBucket(
	yawAngle: number,
	happyScore: number,
	eyesOpen: boolean,
	faceDetected: boolean
): {
	bucket: BucketType;
	qualityIssues: QualityIssue[];
	isUsable: boolean;
	rejectionReason?: string;
} {
	const absYaw = Math.abs(yawAngle);
	const qualityIssues: QualityIssue[] = [];

	// Step 1: Critical Filter → D (Discard)
	if (!faceDetected) {
		return {
			bucket: "D",
			qualityIssues: ["no_face"],
			isUsable: false,
			rejectionReason: "얼굴 미감지",
		};
	}

	if (absYaw >= BUCKET_THRESHOLDS.EXTREME_YAW) {
		return {
			bucket: "D",
			qualityIssues: ["extreme_angle"],
			isUsable: false,
			rejectionReason: "각도 부적합",
		};
	}

	// Track eye closure as quality issue for UI warning, but don't reject
	// Eyes closed photos are still usable for LoRA training in A, B, C buckets
	if (!eyesOpen) {
		qualityIssues.push("eyes_closed");
	}

	// Step 2: Vibe Check → C (Smile shots)
	if (happyScore >= BUCKET_THRESHOLDS.MIN_HAPPY_SCORE) {
		return {
			bucket: "C",
			qualityIssues,
			isUsable: true, // A, B, C buckets are always usable (eyes_closed is just a warning)
		};
	}

	// Step 3: Geometry Check → A (Frontal) or B (Semi-profile)
	if (absYaw <= BUCKET_THRESHOLDS.FRONTAL_MAX_YAW) {
		return {
			bucket: "A",
			qualityIssues,
			isUsable: true, // A, B, C buckets are always usable (eyes_closed is just a warning)
		};
	}

	// All angles below EXTREME_YAW (70°) go to B bucket - no Dead Zone
	// This includes angles up to 69° to maximize usable photos
	return {
		bucket: "B",
		qualityIssues,
		isUsable: true,
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
	const classification = classifyBucket(
		yawAngle,
		smileScore,
		eyesOpen,
		faceDetected
	);

	// Merge additional quality issues (like low_resolution)
	const allIssues = [
		...new Set([...classification.qualityIssues, ...additionalIssues]),
	];
	const isUsable =
		classification.isUsable && !additionalIssues.includes("low_resolution");

	// Update rejection reason if low resolution
	let rejectionReason = classification.rejectionReason;
	if (!isUsable && additionalIssues.includes("low_resolution")) {
		rejectionReason = rejectionReason
			? `${rejectionReason}, 저해상도`
			: "저해상도";
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
		A: "text-accent-teal",
		B: "text-accent-rose",
		C: "text-amber-500",
		D: "text-gray-400",
	};
	return colors[bucket];
}

/**
 * Get quality issue message in Korean
 */
export function getQualityIssueMessage(issue: QualityIssue): string {
	const messages: Record<QualityIssue, string> = {
		eyes_closed: "눈 감음",
		low_resolution: "저해상도",
		no_face: "얼굴 미감지",
		negative_expression: "부정적 표정",
		extreme_angle: "과도한 각도",
		multiple_faces: "여러 얼굴 감지",
		face_too_small: "얼굴이 너무 작음",
	};
	return messages[issue];
}
