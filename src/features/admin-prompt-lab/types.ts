// =============================================================================
// Admin Prompt Lab Types
// =============================================================================

import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Console Log Types
// =============================================================================

export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type LogPhase = 'config' | 'progress' | 'result';

export interface ConsoleLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  phase: LogPhase;
  message: string;
  payload?: unknown;
}

// =============================================================================
// Prompt Overrides (matches Modal workflow nodes)
// =============================================================================

export interface PromptOverrides {
  // Base Generation
  mainPositive?: string;      // Node 6
  mainNegative?: string;      // Node 7

  // Groom Face Detailer
  groomFacePositive?: string; // Node 21
  groomFaceNegative?: string; // Node 26

  // Bride Face Detailer
  brideFacePositive?: string; // Node 23
  brideFaceNegative?: string; // Node 27

  // Hand Detailer
  handPositive?: string;      // Node 38
  handNegative?: string;      // Node 39
}

// =============================================================================
// Node Overrides (ComfyUI workflow parameters)
// =============================================================================

export interface NodeOverrides {
  // KSampler (Node 3)
  samplerName?: string;
  scheduler?: string;
  cfg?: number;
  steps?: number;

  // EmptyLatentImage (Node 5)
  width?: number;
  height?: number;

  // Groom Face Detailer (Node 32)
  groomDenoise?: number;
  groomSteps?: number;
  groomCfg?: number;
  groomGuideSize?: number;

  // Bride Face Detailer (Node 33)
  brideDenoise?: number;
  brideSteps?: number;
  brideCfg?: number;
  brideGuideSize?: number;

  // Hand Detailer (Node 37)
  handDenoise?: number;
  handSteps?: number;
  handCfg?: number;
  handGuideSize?: number;

  // LoRA Strength (Node 14, 15)
  groomLoraStrength?: number;
  brideLoraStrength?: number;

  // Detector settings (BboxDetectorSEGS)
  faceThreshold?: number;
  faceDilation?: number;
  faceCropFactor?: number;
  handThreshold?: number;
  handCropFactor?: number;
}

// =============================================================================
// Assembled Prompts (final prompts sent to ComfyUI)
// =============================================================================

export interface AssembledPrompts {
  node6MainPositive: string;
  node7MainNegative: string;
  node21GroomFace: string;
  node26GroomFaceNegative: string;
  node23BrideFace: string;
  node27BrideFaceNegative: string;
  node38HandPositive: string;
  node39HandNegative: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface PromptTestGenerateRequest {
  themeSlug: ThemeSlug;
  shotType: ShotType;
  promptOverrides?: PromptOverrides;
  nodeOverrides?: NodeOverrides;
  groomLoraUrl: string;
  brideLoraUrl: string;
  seed?: number;
  extraStyleTags?: string;
  count?: number;
}

export interface PromptTestImage {
  base64: string;
  contentType: string;
  width: number;
  height: number;
}

export interface PromptTestGenerateResponse {
  testId: string;
  status: PromptTestStatus;
  assembledPrompts: AssembledPrompts;
  seed: number;
}

// =============================================================================
// Async Job Status Types
// =============================================================================

export type PromptTestStatus = 'queued' | 'generating' | 'completed' | 'failed';

export interface PromptTestStatusResponse {
  id: string;
  status: PromptTestStatus;
  progress: number;
  totalCount: number;
  images: PromptTestImage[] | null;
  generationTimeMs: number | null;
  errorMessage: string | null;
  assembledPrompts: AssembledPrompts;
  seed: number | null;
}

// =============================================================================
// Database Types
// =============================================================================

export const QUALITY_ISSUES = [
  { id: 'finger_broken', label: '🖐️ 손가락 깨짐' },
  { id: 'hand_distorted', label: '✋ 손 뭉개짐' },
  { id: 'face_distorted', label: '😵 얼굴 왜곡' },
  { id: 'skin_blurry', label: '🫧 피부 뭉개짐' },
  { id: 'skin_plastic', label: '🪞 피부 과보정' },
  { id: 'lighting_off', label: '💡 조명 이상' },
  { id: 'pose_unnatural', label: '🧍 포즈 부자연스러움' },
  { id: 'clothing_error', label: '👔 의상 오류' },
  { id: 'background_leak', label: '🖼️ 배경 침범' },
  { id: 'composition_bad', label: '📐 구도 불량' },
  { id: 'quality_good', label: '✅ 품질 양호' },
] as const;

export type QualityIssueId = typeof QUALITY_ISSUES[number]['id'];

export interface AdminPromptTest {
  id: string;
  userId: string;

  // Basic settings
  themeSlug: ThemeSlug;
  shotType: ShotType;

  // Overrides
  promptOverrides: PromptOverrides | null;
  nodeOverrides: NodeOverrides | null;

  // Generation settings
  seed: number | null;
  extraStyleTags: string | null;

  // LoRA info
  groomLoraUrl: string | null;
  brideLoraUrl: string | null;

  // Results
  images: PromptTestImage[] | null;
  generationTimeMs: number | null;

  // Assembled prompts (for reproducibility)
  assembledPrompts: AssembledPrompts;

  // Async job status
  status: PromptTestStatus;
  progress: number;
  totalCount: number;
  errorMessage: string | null;

  // Evaluation
  qualityIssues: QualityIssueId[] | null;
  notes: string | null;

  // Flags
  isFavorite: boolean;

  // Timestamps
  createdAt: string;
}

// =============================================================================
// Database Row Type (snake_case)
// =============================================================================

export interface AdminPromptTestRow {
  id: string;
  user_id: string;

  theme_slug: string;
  shot_type: string;

  prompt_overrides: PromptOverrides | null;
  node_overrides: NodeOverrides | null;

  seed: number | null;
  extra_style_tags: string | null;

  groom_lora_url: string | null;
  bride_lora_url: string | null;

  images: PromptTestImage[] | null;
  generation_time_ms: number | null;

  assembled_prompts: AssembledPrompts;

  // Async job status
  status: PromptTestStatus;
  progress: number;
  total_count: number;
  error_message: string | null;

  quality_issues: string[] | null;
  notes: string | null;

  is_favorite: boolean;

  created_at: string;
}

// =============================================================================
// Mapper Functions
// =============================================================================

export const mapRowToAdminPromptTest = (row: AdminPromptTestRow): AdminPromptTest => ({
  id: row.id,
  userId: row.user_id,
  themeSlug: row.theme_slug as ThemeSlug,
  shotType: row.shot_type as ShotType,
  promptOverrides: row.prompt_overrides,
  nodeOverrides: row.node_overrides,
  seed: row.seed,
  extraStyleTags: row.extra_style_tags,
  groomLoraUrl: row.groom_lora_url,
  brideLoraUrl: row.bride_lora_url,
  images: row.images,
  generationTimeMs: row.generation_time_ms,
  assembledPrompts: row.assembled_prompts,
  status: row.status,
  progress: row.progress,
  totalCount: row.total_count,
  errorMessage: row.error_message,
  qualityIssues: row.quality_issues as QualityIssueId[] | null,
  notes: row.notes,
  isFavorite: row.is_favorite,
  createdAt: row.created_at,
});

// =============================================================================
// History Query Types
// =============================================================================

export interface PromptTestHistoryQuery {
  themeSlug?: ThemeSlug;
  qualityIssue?: QualityIssueId;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface PromptTestHistoryResponse {
  tests: AdminPromptTest[];
  total: number;
  hasMore: boolean;
}

export interface PromptTestUpdateRequest {
  qualityIssues?: QualityIssueId[];
  notes?: string;
  isFavorite?: boolean;
}

// =============================================================================
// Theme Config Types (for frontend display)
// =============================================================================

export interface ThemePromptSection {
  camera: string;
  composition: string;
  background: string;
  atmosphere: string;
  lighting: string;
  groomStyle: string;
  brideStyle: string;
  quality: string;
}

export interface WorkflowNodeOverride {
  sampler_name?: string;
  scheduler?: string;
  steps?: number;
  cfg?: number;
  denoise?: number;
  guide_size?: number;
}

export interface DetectorOverride {
  face_threshold?: number;
  face_dilation?: number;
  face_crop_factor?: number;
  hand_threshold?: number;
  hand_crop_factor?: number;
}

export interface WorkflowOverrides {
  preset?: string;
  KSampler?: WorkflowNodeOverride;
  GroomFaceDetailer?: WorkflowNodeOverride;
  BrideFaceDetailer?: WorkflowNodeOverride;
  HandDetailer?: WorkflowNodeOverride;
  Detector?: DetectorOverride;
}

export interface ThemeConfig {
  slug: ThemeSlug;
  nameKo: string;
  nameEn: string;
  description: string;
  mainPositive: ThemePromptSection;
  mainNegative: string;
  groomFacePositive: string;
  groomFaceNegative: string;
  brideFacePositive: string;
  brideFaceNegative: string;
  handPositive: string;
  handNegative: string;
  defaultSettings: {
    cfg: number;
    steps: number;
    width: number;
    height: number;
  };
  workflowOverrides?: WorkflowOverrides;
}

// =============================================================================
// Node Settings Defaults
// =============================================================================

export const DEFAULT_NODE_SETTINGS = {
  // KSampler (Node 3)
  samplerName: 'euler',
  scheduler: 'simple',
  cfg: 1,
  steps: 25,

  // EmptyLatentImage (Node 5)
  width: 896,
  height: 1152,

  // Groom Face Detailer (Node 32)
  groomDenoise: 0.6,
  groomSteps: 15,
  groomCfg: 1,
  groomGuideSize: 1024,

  // Bride Face Detailer (Node 33)
  brideDenoise: 0.6,
  brideSteps: 8,
  brideCfg: 1,
  brideGuideSize: 1024,

  // Hand Detailer (Node 37)
  handDenoise: 0.35,
  handSteps: 10,
  handCfg: 8,
  handGuideSize: 512,

  // LoRA Strength (Node 14, 15)
  groomLoraStrength: 1.0,
  brideLoraStrength: 1.0,

  // Detector settings
  faceThreshold: 0.25,
  faceDilation: 10,
  faceCropFactor: 5,
  handThreshold: 0.4,
  handCropFactor: 3,
} as const;

export const SAMPLER_OPTIONS = [
  'euler',
  'euler_ancestral',
  'heun',
  'dpm_2',
  'dpm_2_ancestral',
  'lms',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_sde',
] as const;

export const SCHEDULER_OPTIONS = [
  'simple',
  'karras',
  'normal',
  'sgm_uniform',
] as const;

export type SamplerName = typeof SAMPLER_OPTIONS[number];
export type SchedulerName = typeof SCHEDULER_OPTIONS[number];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert ThemePromptSection object to a formatted prompt string
 */
export const formatMainPositivePrompt = (section: ThemePromptSection): string => {
  const parts = [
    section.camera,
    section.composition,
    section.background,
    section.atmosphere,
    section.lighting,
    section.groomStyle,
    section.brideStyle,
    section.quality,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Get the effective node settings (merge theme defaults with overrides)
 */
export const getEffectiveNodeSettings = (
  themeDefaults: ThemeConfig['defaultSettings'] | undefined,
  overrides: NodeOverrides
): NodeOverrides => {
  return {
    ...DEFAULT_NODE_SETTINGS,
    cfg: themeDefaults?.cfg ?? DEFAULT_NODE_SETTINGS.cfg,
    steps: themeDefaults?.steps ?? DEFAULT_NODE_SETTINGS.steps,
    width: themeDefaults?.width ?? DEFAULT_NODE_SETTINGS.width,
    height: themeDefaults?.height ?? DEFAULT_NODE_SETTINGS.height,
    ...overrides,
  };
};
