/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @vladmandic/face-api before importing face-mesh
vi.mock("@vladmandic/face-api", () => ({
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
	},
	SsdMobilenetv1Options: vi.fn().mockImplementation((options) => ({
		_name: "SsdMobilenetv1Options",
		minConfidence: options?.minConfidence ?? 0.5,
	})),
	detectAllFaces: vi.fn(),
}));

// Import @vladmandic/face-api after mocking
import * as faceapi from "@vladmandic/face-api";

// Reset module state between tests
beforeEach(() => {
	vi.clearAllMocks();
});

describe("face-mesh with SSD Mobilenet v1", () => {
	describe("loadModels", () => {
		it("should load ssdMobilenetv1 model", async () => {
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
				},
				SsdMobilenetv1Options: vi.fn(),
				detectAllFaces: vi.fn(),
			}));

			const faceapiMock = await import("face-api.js");
			const { preloadFaceModels } = await import("./face-mesh");

			await preloadFaceModels();

			expect(faceapiMock.nets.ssdMobilenetv1.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);
			expect(faceapiMock.nets.faceLandmark68Net.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);
			expect(faceapiMock.nets.faceExpressionNet.loadFromUri).toHaveBeenCalledWith(
				"/models"
			);
		});
	});

	describe("analyzeFace", () => {
		it("should use SsdMobilenetv1Options with minConfidence 0.5", async () => {
			vi.resetModules();

			const mockSsdOptions = vi.fn().mockImplementation((options) => ({
				_name: "SsdMobilenetv1Options",
				minConfidence: options?.minConfidence ?? 0.5,
			}));

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
				},
				SsdMobilenetv1Options: mockSsdOptions,
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

			expect(mockSsdOptions).toHaveBeenCalledWith({
				minConfidence: 0.5,
			});
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
				},
				SsdMobilenetv1Options: vi.fn(),
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

			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.95,
				},
				landmarks: {
					positions: createMockLandmarks(0),
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
				},
				SsdMobilenetv1Options: vi.fn(),
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
			expect(result.bucket).toBe("A");
			expect(result.isUsable).toBe(true);
		});

		it("should classify smiling face as C bucket regardless of angle", async () => {
			vi.resetModules();

			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.95,
				},
				landmarks: {
					positions: createMockLandmarks(0),
				},
				expressions: {
					happy: 0.8,
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
				},
				SsdMobilenetv1Options: vi.fn(),
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
			expect(result.bucket).toBe("C");
			expect(result.isUsable).toBe(true);
		});

		it("should detect side profile face as B bucket", async () => {
			vi.resetModules();

			const mockDetection = {
				detection: {
					box: { width: 200, height: 200 },
					score: 0.7,
				},
				landmarks: {
					positions: createMockLandmarks(35),
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
				},
				SsdMobilenetv1Options: vi.fn(),
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
			expect(result.bucket).toBe("B");
			expect(result.isUsable).toBe(true);
		});

		it("should reject multiple significant faces", async () => {
			vi.resetModules();

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
				},
				SsdMobilenetv1Options: vi.fn(),
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

			const mockDetection = {
				detection: {
					box: { width: 30, height: 30 },
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
				},
				SsdMobilenetv1Options: vi.fn(),
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
 */
function createMockLandmarks(yawOffset: number): Array<{ x: number; y: number }> {
	const landmarks: Array<{ x: number; y: number }> = [];

	for (let i = 0; i < 68; i++) {
		landmarks.push({ x: 100 + i, y: 100 + i });
	}

	// Eye landmarks for EAR calculation
	landmarks[36] = { x: 80, y: 100 };
	landmarks[37] = { x: 85, y: 95 };
	landmarks[38] = { x: 90, y: 95 };
	landmarks[39] = { x: 95, y: 100 };
	landmarks[40] = { x: 90, y: 105 };
	landmarks[41] = { x: 85, y: 105 };

	landmarks[42] = { x: 105, y: 100 };
	landmarks[43] = { x: 110, y: 95 };
	landmarks[44] = { x: 115, y: 95 };
	landmarks[45] = { x: 120, y: 100 };
	landmarks[46] = { x: 115, y: 105 };
	landmarks[47] = { x: 110, y: 105 };

	// Nose tip - offset to simulate yaw
	const eyeMidX = (80 + 120) / 2;
	const eyeDistance = 40;
	const xOffset = Math.tan((yawOffset * Math.PI) / 180) * (eyeDistance * 0.4);
	landmarks[30] = { x: eyeMidX + xOffset, y: 110 };

	return landmarks;
}
