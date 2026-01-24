import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

// Store mock references for manipulation in tests
let mockFaceLandmarkerInstance: {
	detect: Mock;
	close: Mock;
};

// Mock @mediapipe/tasks-vision before importing face-mesh
vi.mock("@mediapipe/tasks-vision", () => {
	const mockDetect = vi.fn();
	const mockClose = vi.fn();
	mockFaceLandmarkerInstance = { detect: mockDetect, close: mockClose };

	return {
		FilesetResolver: {
			forVisionTasks: vi.fn().mockResolvedValue({}),
		},
		FaceLandmarker: {
			createFromOptions: vi.fn().mockResolvedValue({
				detect: mockDetect,
				close: mockClose,
			}),
		},
	};
});

// Import after mocking
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Reset module state between tests
beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("face-mesh with MediaPipe FaceLandmarker", () => {
	describe("loadModels", () => {
		it("should initialize FilesetResolver with correct WASM path", async () => {
			vi.resetModules();

			const mockForVisionTasks = vi.fn().mockResolvedValue({});
			const mockCreateFromOptions = vi.fn().mockResolvedValue({
				detect: vi.fn(),
				close: vi.fn(),
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: mockForVisionTasks,
				},
				FaceLandmarker: {
					createFromOptions: mockCreateFromOptions,
				},
			}));

			const { preloadFaceModels } = await import("./face-mesh");

			await preloadFaceModels();

			expect(mockForVisionTasks).toHaveBeenCalledWith(
				"/models/mediapipe/wasm"
			);
		});

		it("should create FaceLandmarker with correct options", async () => {
			vi.resetModules();

			const mockForVisionTasks = vi.fn().mockResolvedValue({ vision: true });
			const mockCreateFromOptions = vi.fn().mockResolvedValue({
				detect: vi.fn(),
				close: vi.fn(),
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: mockForVisionTasks,
				},
				FaceLandmarker: {
					createFromOptions: mockCreateFromOptions,
				},
			}));

			const { preloadFaceModels } = await import("./face-mesh");

			await preloadFaceModels();

			expect(mockCreateFromOptions).toHaveBeenCalledWith(
				{ vision: true },
				expect.objectContaining({
					baseOptions: expect.objectContaining({
						modelAssetPath: "/models/mediapipe/face_landmarker.task",
						delegate: "GPU",
					}),
					runningMode: "IMAGE",
					numFaces: 5,
					outputFaceBlendshapes: true,
				})
			);
		});

		it("should only load models once (singleton pattern)", async () => {
			vi.resetModules();

			const mockForVisionTasks = vi.fn().mockResolvedValue({});
			const mockCreateFromOptions = vi.fn().mockResolvedValue({
				detect: vi.fn(),
				close: vi.fn(),
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: mockForVisionTasks,
				},
				FaceLandmarker: {
					createFromOptions: mockCreateFromOptions,
				},
			}));

			const { preloadFaceModels } = await import("./face-mesh");

			await preloadFaceModels();
			await preloadFaceModels();
			await preloadFaceModels();

			expect(mockForVisionTasks).toHaveBeenCalledTimes(1);
			expect(mockCreateFromOptions).toHaveBeenCalledTimes(1);
		});
	});

	describe("analyzeFace", () => {
		it("should return faceDetected: false when no face is detected", async () => {
			vi.resetModules();

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue({
							faceLandmarks: [],
							faceBlendshapes: [],
						}),
						close: vi.fn(),
					}),
				},
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

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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
			expect(result.bucket).toBe("A");
			expect(result.isUsable).toBe(true);
		});

		it("should classify smiling face as C bucket regardless of angle", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.8, // High smile score
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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

			const mockResult = createMockMediaPipeResult({
				yawOffset: 35, // Side angle
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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

			// Create result with 2 faces
			const mockResult = {
				faceLandmarks: [
					createMock478Landmarks(0),
					createMock478Landmarks(10),
				],
				faceBlendshapes: [
					{ categories: createMockBlendshapes(0.3, true) },
					{ categories: createMockBlendshapes(0.4, true) },
				],
			};

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 30, // Very small face
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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

	describe("smile detection using blendshapes", () => {
		it("should extract smile score from mouthSmileLeft and mouthSmileRight blendshapes", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.85, // High smile
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.smileScore).toBeCloseTo(0.85, 1);
			expect(result.bucket).toBe("C"); // Classified as smile bucket
		});
	});

	describe("eye open detection using blendshapes", () => {
		it("should detect closed eyes from eyeBlinkLeft and eyeBlinkRight blendshapes", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.3,
				eyesOpen: false, // Eyes closed (high blink score)
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.eyesOpen).toBe(false);
		});

		it("should detect open eyes when blink score is low", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.3,
				eyesOpen: true, // Eyes open (low blink score)
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			expect(result.eyesOpen).toBe(true);
		});
	});

	describe("yaw angle calculation", () => {
		it("should calculate yaw angle correctly for frontal face", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0, // Frontal
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			// Frontal face should have yaw close to 0
			expect(Math.abs(result.yawAngle)).toBeLessThan(12);
			expect(result.bucket).toBe("A");
		});

		it("should calculate yaw angle correctly for side face", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 40, // Significant side angle
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 1000,
				naturalWidth: 1000,
				naturalHeight: 1000,
			} as HTMLImageElement;

			const result = await analyzeFace(mockImage);

			// Side face should have yaw > 12 and < 65
			expect(Math.abs(result.yawAngle)).toBeGreaterThan(12);
			expect(result.bucket).toBe("B");
		});
	});

	describe("cleanupFaceMesh", () => {
		it("should be callable without errors", async () => {
			const { cleanupFaceMesh } = await import("./face-mesh");
			expect(() => cleanupFaceMesh()).not.toThrow();
		});
	});

	describe("analyzeFace - Auto-Rotation Fallback", () => {
		it("should return appliedRotation: 0 when face is detected without rotation", async () => {
			vi.resetModules();

			const mockResult = createMockMediaPipeResult({
				yawOffset: 0,
				smileScore: 0.3,
				eyesOpen: true,
				faceSize: 200,
			});

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue(mockResult),
						close: vi.fn(),
					}),
				},
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
			expect(result.appliedRotation).toBe(0);
		});

		it("should return faceDetected: false when no face at any rotation", async () => {
			vi.resetModules();

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue({
							faceLandmarks: [],
							faceBlendshapes: [],
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { analyzeFace } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
			} as HTMLImageElement;

			// Mock canvas for rotation fallback
			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await analyzeFace(mockImage);

			expect(result.faceDetected).toBe(false);
			expect(result.bucket).toBe("D");
		});
	});

	describe("detectRotationByTrial - Confidence-Based Selection", () => {
		it("should select rotation with highest confidence when multiple rotations detect faces", async () => {
			vi.resetModules();

			// Track call count to return different results per rotation
			let callCount = 0;

			// Call order: 0° → 90° → 270° → 180°
			// 0°: faceLandmarks.length = 1 (face detected but low quality)
			// 90°: faceLandmarks.length = 1 (face detected with better quality - best)
			// 270°: faceLandmarks.length = 0
			// 180°: faceLandmarks.length = 0

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockImplementation(() => {
							callCount++;
							// 90° rotation (callCount = 2) has best result
							if (callCount === 1) {
								// 0° - face detected
								return createMockMediaPipeResult({
									yawOffset: 45, // Significant angle suggests wrong rotation
									smileScore: 0.2,
									eyesOpen: true,
									faceSize: 150,
								});
							} else if (callCount === 2) {
								// 90° - best detection (frontal face)
								return createMockMediaPipeResult({
									yawOffset: 0,
									smileScore: 0.3,
									eyesOpen: true,
									faceSize: 200, // Larger face = better detection
								});
							}
							// 270°, 180° - no face
							return { faceLandmarks: [], faceBlendshapes: [] };
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { detectRotationByTrial } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
				naturalWidth: 1000,
				naturalHeight: 800,
			} as HTMLImageElement;

			// Mock canvas
			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await detectRotationByTrial(mockImage);

			expect(result).not.toBeNull();
			expect(result?.needsRotation).toBe(true);
			expect(result?.correctionDegrees).toBe(90); // 90° test = 90° correction (rotate CW to upright)
		});

		it("should not rotate when 0° has best detection", async () => {
			vi.resetModules();

			let callCount = 0;

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockImplementation(() => {
							callCount++;
							if (callCount === 1) {
								// 0° - best detection
								return createMockMediaPipeResult({
									yawOffset: 0,
									smileScore: 0.3,
									eyesOpen: true,
									faceSize: 200,
								});
							}
							// Other rotations - worse or no face
							return { faceLandmarks: [], faceBlendshapes: [] };
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { detectRotationByTrial } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
			} as HTMLImageElement;

			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await detectRotationByTrial(mockImage);

			expect(result?.needsRotation).toBe(false);
			expect(result?.correctionDegrees).toBe(0);
		});

		it("should return null when no face detected at any rotation", async () => {
			vi.resetModules();

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockReturnValue({
							faceLandmarks: [],
							faceBlendshapes: [],
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { detectRotationByTrial } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
			} as HTMLImageElement;

			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await detectRotationByTrial(mockImage);

			expect(result).toBeNull();
		});

		it("should detect 180° rotation correctly", async () => {
			vi.resetModules();

			let callCount = 0;

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockImplementation(() => {
							callCount++;
							// Call order: 0° → 90° → 270° → 180°
							if (callCount === 4) {
								// 180° - best detection
								return createMockMediaPipeResult({
									yawOffset: 0,
									smileScore: 0.3,
									eyesOpen: true,
									faceSize: 200,
								});
							}
							return { faceLandmarks: [], faceBlendshapes: [] };
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { detectRotationByTrial } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
			} as HTMLImageElement;

			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await detectRotationByTrial(mockImage);

			expect(result?.needsRotation).toBe(true);
			expect(result?.correctionDegrees).toBe(180);
		});

		it("should detect 270° rotation correctly (90° CCW)", async () => {
			vi.resetModules();

			let callCount = 0;

			vi.doMock("@mediapipe/tasks-vision", () => ({
				FilesetResolver: {
					forVisionTasks: vi.fn().mockResolvedValue({}),
				},
				FaceLandmarker: {
					createFromOptions: vi.fn().mockResolvedValue({
						detect: vi.fn().mockImplementation(() => {
							callCount++;
							// Call order: 0° → 90° → 270° → 180°
							if (callCount === 3) {
								// 270° - best detection
								return createMockMediaPipeResult({
									yawOffset: 0,
									smileScore: 0.3,
									eyesOpen: true,
									faceSize: 200,
								});
							}
							return { faceLandmarks: [], faceBlendshapes: [] };
						}),
						close: vi.fn(),
					}),
				},
			}));

			const { detectRotationByTrial } = await import("./face-mesh");

			const mockImage = {
				width: 1000,
				height: 800,
			} as HTMLImageElement;

			const mockCanvas = {
				width: 0,
				height: 0,
				getContext: () => ({
					clearRect: vi.fn(),
					translate: vi.fn(),
					rotate: vi.fn(),
					drawImage: vi.fn(),
					setTransform: vi.fn(),
				}),
			};
			vi.spyOn(document, "createElement").mockReturnValue(
				mockCanvas as unknown as HTMLElement
			);

			const result = await detectRotationByTrial(mockImage);

			expect(result?.needsRotation).toBe(true);
			expect(result?.correctionDegrees).toBe(-90); // 270° test = -90° correction (rotate CCW to upright)
		});
	});
});

/**
 * Helper function to create mock MediaPipe 478-point face landmarks
 * MediaPipe uses normalized coordinates (0-1) unlike face-api.js
 * @param yawOffset - Yaw angle offset to simulate
 * @param faceScale - Scale factor for face size (default 1.0 = ~20% of image, 0.1 = ~2% of image)
 */
function createMock478Landmarks(
	yawOffset: number,
	faceScale: number = 1.0
): Array<{ x: number; y: number; z: number }> {
	const landmarks: Array<{ x: number; y: number; z: number }> = [];

	// Center position
	const centerX = 0.5;
	const centerY = 0.5;

	// Base face size (normalized units)
	const baseWidth = 0.2 * faceScale; // Face width as fraction of image
	const baseHeight = 0.25 * faceScale; // Face height as fraction of image

	// Initialize all 478 points within the face region
	for (let i = 0; i < 478; i++) {
		// Spread points within the face bounding box
		const offsetX = ((i % 22) / 22 - 0.5) * baseWidth;
		const offsetY = (Math.floor(i / 22) / 22 - 0.5) * baseHeight;
		landmarks.push({
			x: centerX + offsetX,
			y: centerY + offsetY,
			z: 0,
		});
	}

	// MediaPipe landmark indices for key points:
	// 4: Nose tip
	// 33: Left eye outer corner (eye on LEFT side of image = lower X)
	// 263: Right eye outer corner (eye on RIGHT side of image = higher X)

	// Set up eye positions (normalized 0-1) - scaled by faceScale
	// MediaPipe assigns landmarks based on IMAGE position (not anatomical)
	// So landmark 33 is the eye on the LEFT side of the image
	const eyeSpread = 0.15 * faceScale; // Distance from center to each eye
	const leftEyeX = centerX - eyeSpread; // Lower X (left side of image)
	const rightEyeX = centerX + eyeSpread; // Higher X (right side of image)
	const eyeY = centerY - 0.05 * faceScale; // Eyes slightly above center

	// For a normal upright face:
	// Landmark 33 (left eye) is on the left side of image (lower X)
	// Landmark 263 (right eye) is on the right side of image (higher X)
	landmarks[33] = { x: leftEyeX, y: eyeY, z: 0 }; // Left eye - on left side of image
	landmarks[263] = { x: rightEyeX, y: eyeY, z: 0 }; // Right eye - on right side of image

	// Calculate nose tip position based on yaw offset
	const eyeMidX = (leftEyeX + rightEyeX) / 2;
	const eyeDistance = Math.abs(rightEyeX - leftEyeX);
	const xOffset = Math.tan((yawOffset * Math.PI) / 180) * (eyeDistance * 0.4);

	landmarks[4] = { x: eyeMidX + xOffset, y: centerY + 0.05 * faceScale, z: 0 }; // Nose tip

	return landmarks;
}

/**
 * Helper function to create mock blendshapes
 */
function createMockBlendshapes(
	smileScore: number,
	eyesOpen: boolean
): Array<{ categoryName: string; score: number }> {
	return [
		{ categoryName: "mouthSmileLeft", score: smileScore },
		{ categoryName: "mouthSmileRight", score: smileScore },
		{ categoryName: "eyeBlinkLeft", score: eyesOpen ? 0.1 : 0.9 },
		{ categoryName: "eyeBlinkRight", score: eyesOpen ? 0.1 : 0.9 },
		// Add other blendshapes as needed
		{ categoryName: "browDownLeft", score: 0 },
		{ categoryName: "browDownRight", score: 0 },
		{ categoryName: "browInnerUp", score: 0 },
		{ categoryName: "browOuterUpLeft", score: 0 },
		{ categoryName: "browOuterUpRight", score: 0 },
	];
}

/**
 * Helper function to create a complete mock MediaPipe detection result
 * Note: faceBlendshapes must be an array of Classifications objects,
 * each with a 'categories' property containing the actual blendshapes.
 */
function createMockMediaPipeResult(options: {
	yawOffset?: number;
	smileScore?: number;
	eyesOpen?: boolean;
	faceSize?: number; // Target face size in pixels (for 1000x1000 image)
}): {
	faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
	faceBlendshapes: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
} {
	const yawOffset = options.yawOffset ?? 0;
	const smileScore = options.smileScore ?? 0;
	const eyesOpen = options.eyesOpen ?? true;
	const faceSize = options.faceSize ?? 200;

	// Calculate face scale based on target face size
	// For a 1000x1000 image:
	// - faceSize=200 should give ~4% area ratio (200*200 / 1000000 = 0.04) = scale 1.0
	// - faceSize=30 should give ~0.09% area ratio (30*30 / 1000000 = 0.0009) = scale ~0.15
	// SIGNIFICANT_FACE_SIZE_RATIO = 0.03, so faceSize < 173 should fail
	const targetAreaRatio = (faceSize * faceSize) / (1000 * 1000);
	// Scale is roughly sqrt(targetAreaRatio / 0.05) where 0.05 is the default area
	const faceScale = Math.sqrt(targetAreaRatio / 0.05);

	return {
		faceLandmarks: [createMock478Landmarks(yawOffset, faceScale)],
		// Wrap blendshapes in Classifications-like structure with 'categories' property
		faceBlendshapes: [{ categories: createMockBlendshapes(smileScore, eyesOpen) }],
	};
}
