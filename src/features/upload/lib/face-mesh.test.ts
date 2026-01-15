/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock face-api.js before importing face-mesh
vi.mock("face-api.js", () => ({
	nets: {
		ssdMobilenetv1: {
			loadFromUri: vi.fn().mockResolvedValue(undefined),
		},
		faceLandmark68Net: {
			loadFromUri: vi.fn().mockResolvedValue(undefined),
		},
		faceExpressionNet: {
			loadFromUri: vi.fn().mockResolvedValue(undefined),
		},
		// TinyFaceDetector should NOT be loaded anymore
		tinyFaceDetector: {
			loadFromUri: vi.fn().mockResolvedValue(undefined),
		},
	},
	SsdMobilenetv1Options: vi.fn().mockImplementation((options) => ({
		_name: "SsdMobilenetv1Options",
		minConfidence: options?.minConfidence ?? 0.5,
	})),
	// Keep TinyFaceDetectorOptions mock to verify it's NOT used
	TinyFaceDetectorOptions: vi.fn().mockImplementation((options) => ({
		_name: "TinyFaceDetectorOptions",
		inputSize: options?.inputSize ?? 416,
		scoreThreshold: options?.scoreThreshold ?? 0.5,
	})),
	detectAllFaces: vi.fn(),
}));

// Import face-api.js after mocking
import * as faceapi from "face-api.js";

// Reset module state between tests
beforeEach(() => {
	vi.clearAllMocks();
});

describe("face-mesh with SSD Mobilenet v1", () => {
	describe("loadModels", () => {
		it("should load ssdMobilenetv1 model instead of tinyFaceDetector", async () => {
			// Reset modules to get fresh module state
			vi.resetModules();

			// Re-mock after reset
			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn(),
			}));

			const faceapiMock = await import("face-api.js");
			const { preloadFaceModels } = await import("./face-mesh");

			await preloadFaceModels();

			// SSD Mobilenet v1 should be loaded
			expect(faceapiMock.nets.ssdMobilenetv1.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);
			expect(faceapiMock.nets.faceLandmark68Net.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);
			expect(faceapiMock.nets.faceExpressionNet.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);

			// TinyFaceDetector should NOT be loaded
			expect(faceapiMock.nets.tinyFaceDetector.loadFromUri).not.toHaveBeenCalled();
		});
	});

	describe("analyzeFace", () => {
		it("should use SsdMobilenetv1Options with minConfidence 0.5", async () => {
			vi.resetModules();

			const mockSsdOptions = vi.fn().mockImplementation((options) => ({
				_name: "SsdMobilenetv1Options",
				minConfidence: options?.minConfidence ?? 0.5,
			}));

			const mockTinyOptions = vi.fn();

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: mockSsdOptions,
				TinyFaceDetectorOptions: mockTinyOptions,
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			await analyzeFace(mockImage);

			// Verify SsdMobilenetv1Options was used, not TinyFaceDetectorOptions
			expect(mockSsdOptions).toHaveBeenCalledWith({
				minConfidence: 0.5,
			});
			expect(mockTinyOptions).not.toHaveBeenCalled();
		});

		it("should return faceDetected: false when no face is detected", async () => {
			vi.resetModules();

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.faceDetected).toBe(false);
			expect(result.bucket).toBe("D");
			expect(result.isUsable).toBe(false);
		});

		it("should detect frontal face without smile and classify as A bucket", async () => {
			vi.resetModules();

			// Mock a frontal face detection result (not smiling)
			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.95, // High confidence
				},
				landmarks: {
					positions: createMockLandmarks(0), // Frontal face (yaw ~0)
				},
				expressions: {
					happy: 0.3, // Not smiling (< 0.7 threshold)
				},
			};

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([mockDetection]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.faceDetected).toBe(true);
			expect(result.confidence).toBeGreaterThan(0.5);
			expect(result.bucket).toBe("A"); // Frontal (yaw <= 12°), not smiling → A bucket
			expect(result.isUsable).toBe(true);
		});

		it("should classify smiling face as C bucket regardless of angle", async () => {
			vi.resetModules();

			// Mock a smiling frontal face
			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.95,
				},
				landmarks: {
					positions: createMockLandmarks(0), // Frontal face
				},
				expressions: {
					happy: 0.8, // Smiling (>= 0.7 threshold)
				},
			};

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([mockDetection]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.faceDetected).toBe(true);
			expect(result.bucket).toBe("C"); // Smiling → C bucket (regardless of angle)
			expect(result.isUsable).toBe(true);
		});

		it("should detect side profile face (yaw > 20 degrees)", async () => {
			vi.resetModules();

			// Mock a side profile face detection
			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.7, // SSD model gives decent confidence even for side profiles
				},
				landmarks: {
					positions: createMockLandmarks(35), // Side profile (yaw ~35)
				},
				expressions: {
					happy: 0.3,
				},
			};

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([mockDetection]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.faceDetected).toBe(true);
			// Side profile should be classified as B (semi-profile) or still usable
			expect(["A", "B", "C"]).toContain(result.bucket);
		});

		it("should reject multiple significant faces", async () => {
			vi.resetModules();

			// Mock multiple face detections
			const mockDetections = [
				{
					detection: {
						box: { width: 200, height: 200 },
						score: 0.9,
					},
					landmarks: { positions: createMockLandmarks(0) },
					expressions: { happy: 0.5 },
				},
				{
					detection: {
						box: { width: 180, height: 180 },
						score: 0.85,
					},
					landmarks: { positions: createMockLandmarks(10) },
					expressions: { happy: 0.4 },
				},
			];

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve(mockDetections),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.bucket).toBe("D");
			expect(result.qualityIssues).toContain("multiple_faces");
			expect(result.isUsable).toBe(false);
		});

		it("should reject face that is too small", async () => {
			vi.resetModules();

			// Mock a very small face (full body shot)
			const mockDetection = {
				detection: {
					box: { width: 30, height: 30 }, // Very small face
					score: 0.8,
				},
				landmarks: { positions: createMockLandmarks(0) },
				expressions: { happy: 0.5 },
			};

			vi.doMock("face-api.js", () => ({
				nets: {
					ssdMobilenetv1: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceLandmark68Net: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					faceExpressionNet: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
					tinyFaceDetector: {
						loadFromUri: vi.fn().mockResolvedValue(undefined),
					},
				},
				SsdMobilenetv1Options: vi.fn(),
				TinyFaceDetectorOptions: vi.fn(),
				detectAllFaces: vi.fn().mockReturnValue({
					withFaceLandmarks: () => ({
						withFaceExpressions: () => Promise.resolve([mockDetection]),
					}),
				}),
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			// Face ratio = 30*30 / 1000*1000 = 0.0009 = 0.09% (below 2% threshold)
			// But first it fails the 3% significant face threshold
			expect(result.bucket).toBe("D");
			expect(result.isUsable).toBe(false);
		});
	});

	describe("cleanupFaceMesh", () => {
		it("should be callable without errors", async () => {
			const { cleanupFaceMesh } = await import("./face-mesh");
			expect(() => cleanupFaceMesh()).not.toThrow();
		});
	});
});

/**
 * Helper function to create mock 68-point face landmarks
 * @param yawOffset - Simulated yaw angle offset (0 = frontal, positive = turned right)
 */
function createMockLandmarks(yawOffset: number): Array<{ x: number; y: number }> {
	const landmarks: Array<{ x: number; y: number }> = [];

	// Create 68 landmark points
	for (let i = 0; i < 68; i++) {
		landmarks.push({ x: 100 + i, y: 100 + i });
	}

	// Eye landmarks for EAR calculation (36-41 left, 42-47 right)
	// Left eye (open)
	landmarks[36] = { x: 80, y: 100 };
	landmarks[37] = { x: 85, y: 95 };
	landmarks[38] = { x: 90, y: 95 };
	landmarks[39] = { x: 95, y: 100 };
	landmarks[40] = { x: 90, y: 105 };
	landmarks[41] = { x: 85, y: 105 };

	// Right eye (open)
	landmarks[42] = { x: 105, y: 100 };
	landmarks[43] = { x: 110, y: 95 };
	landmarks[44] = { x: 115, y: 95 };
	landmarks[45] = { x: 120, y: 100 };
	landmarks[46] = { x: 115, y: 105 };
	landmarks[47] = { x: 110, y: 105 };

	// Nose tip (30) - offset to simulate yaw
	const eyeMidX = (80 + 120) / 2; // 100
	const eyeDistance = 40;
	// yawOffset in degrees, convert to x offset
	const xOffset = Math.tan((yawOffset * Math.PI) / 180) * (eyeDistance * 0.4);
	landmarks[30] = { x: eyeMidX + xOffset, y: 110 };

	return landmarks;
}
