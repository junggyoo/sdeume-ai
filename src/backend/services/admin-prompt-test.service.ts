import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  PromptOverrides,
  NodeOverrides,
  AssembledPrompts,
  AdminPromptTest,
  AdminPromptTestRow,
  PromptTestImage,
  PromptTestHistoryQuery,
  PromptTestHistoryResponse,
  PromptTestUpdateRequest,
  PromptTestStatusResponse,
  ThemeConfig,
} from '@/features/admin-prompt-lab/types';
import {
  mapRowToAdminPromptTest,
  DEFAULT_NODE_SETTINGS,
  SAMPLER_OPTIONS,
  SCHEDULER_OPTIONS,
} from '@/features/admin-prompt-lab/types';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';
import {
  getThemeConfig as getThemeConfigFromYaml,
  getAllThemeConfigs as getAllThemeConfigsFromYaml,
} from './theme-loader.service';

// =============================================================================
// Error Codes
// =============================================================================

export type AdminPromptTestError =
  | 'TEST_NOT_FOUND'
  | 'FETCH_ERROR'
  | 'INSERT_ERROR'
  | 'UPDATE_ERROR'
  | 'DELETE_ERROR'
  | 'VALIDATION_ERROR'
  | 'GENERATION_ERROR'
  | 'GENERATION_TIMEOUT';

// =============================================================================
// Prohibited Content for Prompts
// =============================================================================

const PROHIBITED_WORDS = [
  'nude',
  'naked',
  'nsfw',
  'explicit',
  'pornographic',
  'sexual',
  'erotic',
];

// =============================================================================
// Theme Config Loading (from YAML files via theme-loader.service)
// =============================================================================

// Re-export theme loading functions from theme-loader.service
export {
  getThemeConfigFromYaml as getThemeConfig,
  getAllThemeConfigsFromYaml as getAllThemeConfigs,
};

// =============================================================================
// Prompt Assembly
// =============================================================================

interface AssemblePromptsParams {
  themeConfig: ThemeConfig;
  shotType: ShotType;
  groomTrigger: string;
  brideTrigger: string;
  promptOverrides?: PromptOverrides;
  extraStyleTags?: string;
  includeMainTriggers?: boolean;
}

export const assemblePrompts = ({
  themeConfig,
  shotType,
  groomTrigger,
  brideTrigger,
  promptOverrides,
  extraStyleTags,
  includeMainTriggers = false,
}: AssemblePromptsParams): AssembledPrompts => {
  // Build main positive prompt
  let mainPositive: string;

  if (promptOverrides?.mainPositive && promptOverrides.mainPositive.trim()) {
    mainPositive = promptOverrides.mainPositive;
  } else {
    const mp = themeConfig.mainPositive;
    const parts: string[] = [];

    // Adjust camera/composition based on shot type
    if (shotType === 'closeup') {
      parts.push('An upper body portrait shot of the Korean couple facing the camera');
      parts.push('Medium close-up focusing on the upper body and faces');
    } else {
      parts.push(mp.camera);
      parts.push(mp.composition);
    }

    parts.push(mp.background);
    parts.push(mp.atmosphere);
    parts.push(mp.lighting);
    parts.push(mp.groomStyle);
    parts.push(mp.brideStyle);
    parts.push(mp.quality);

    mainPositive = parts.filter(p => p).join('. ').replace(/\.\./g, '.') + '.';
  }

  // Include main triggers if specified
  if (includeMainTriggers) {
    mainPositive = `${groomTrigger}, ${brideTrigger}, ${mainPositive}`;
  }

  // Append extra style tags
  if (extraStyleTags && extraStyleTags.trim()) {
    mainPositive = `${mainPositive} ${extraStyleTags}`;
  }

  // Build main negative prompt
  const mainNegative = promptOverrides?.mainNegative?.trim() || themeConfig.mainNegative;

  // Build groom face prompts
  const groomFaceBase = promptOverrides?.groomFacePositive?.trim() || themeConfig.groomFacePositive;
  const groomFacePositive = `${groomTrigger}, ${groomFaceBase}`;
  const groomFaceNegative = promptOverrides?.groomFaceNegative?.trim() || themeConfig.groomFaceNegative;

  // Build bride face prompts
  const brideFaceBase = promptOverrides?.brideFacePositive?.trim() || themeConfig.brideFacePositive;
  const brideFacePositive = `${brideTrigger}, ${brideFaceBase}`;
  const brideFaceNegative = promptOverrides?.brideFaceNegative?.trim() || themeConfig.brideFaceNegative;

  // Build hand prompts
  const handPositive = promptOverrides?.handPositive?.trim() || themeConfig.handPositive;
  const handNegative = promptOverrides?.handNegative?.trim() ?? themeConfig.handNegative;

  return {
    node6MainPositive: mainPositive,
    node7MainNegative: mainNegative,
    node21GroomFace: groomFacePositive,
    node26GroomFaceNegative: groomFaceNegative,
    node23BrideFace: brideFacePositive,
    node27BrideFaceNegative: brideFaceNegative,
    node38HandPositive: handPositive,
    node39HandNegative: handNegative,
  };
};

// =============================================================================
// Modal Request Building
// =============================================================================

interface BuildModalRequestParams {
  themeSlug: ThemeSlug;
  shotType: ShotType;
  groomLoraUrl: string;
  brideLoraUrl: string;
  promptOverrides?: PromptOverrides;
  nodeOverrides?: NodeOverrides;
  seed?: number;
  extraStyleTags?: string;
}

interface ModalTestRequest {
  groomLoraUrl: string;
  brideLoraUrl: string;
  theme: ThemeSlug;
  shotType: ShotType;
  extraStyleTags?: string;
  groomTrigger: string;
  brideTrigger: string;
  includeMainTriggers: boolean;
  width: number;
  height: number;
  cfg: number;
  steps: number;
  seed: number;
  groomLoraStrength: number;
  brideLoraStrength: number;
  promptOverrides?: PromptOverrides;
  nodeOverrides?: NodeOverrides;
}

export const buildModalRequest = (params: BuildModalRequestParams): ModalTestRequest => {
  const {
    themeSlug,
    shotType,
    groomLoraUrl,
    brideLoraUrl,
    promptOverrides,
    nodeOverrides,
    seed,
    extraStyleTags,
  } = params;

  const defaults = DEFAULT_NODE_SETTINGS;

  return {
    groomLoraUrl,
    brideLoraUrl,
    theme: themeSlug,
    shotType,
    extraStyleTags,
    groomTrigger: 'GROOM_SDME',
    brideTrigger: 'BRIDE_SDME',
    includeMainTriggers: false,
    width: nodeOverrides?.width ?? defaults.width,
    height: nodeOverrides?.height ?? defaults.height,
    cfg: nodeOverrides?.cfg ?? defaults.cfg,
    steps: nodeOverrides?.steps ?? defaults.steps,
    seed: seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
    groomLoraStrength: nodeOverrides?.groomLoraStrength ?? defaults.groomLoraStrength,
    brideLoraStrength: nodeOverrides?.brideLoraStrength ?? defaults.brideLoraStrength,
    promptOverrides,
    nodeOverrides,
  };
};

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validatePromptOverrides = (overrides?: PromptOverrides): ValidationResult => {
  const errors: string[] = [];

  if (!overrides) {
    return { valid: true, errors: [] };
  }

  const fields: (keyof PromptOverrides)[] = [
    'mainPositive',
    'mainNegative',
    'groomFacePositive',
    'groomFaceNegative',
    'brideFacePositive',
    'brideFaceNegative',
    'handPositive',
    'handNegative',
  ];

  for (const field of fields) {
    const value = overrides[field];

    if (value === undefined || value === '') {
      continue;
    }

    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }

    // Check length
    if (value.length > 5000) {
      errors.push(`${field} exceeds maximum length (5000)`);
    }

    // Check prohibited content
    const lowerValue = value.toLowerCase();
    for (const word of PROHIBITED_WORDS) {
      if (lowerValue.includes(word)) {
        errors.push(`${field} contains prohibited content`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateNodeOverrides = (overrides?: NodeOverrides): ValidationResult => {
  const errors: string[] = [];

  if (!overrides) {
    return { valid: true, errors: [] };
  }

  // Sampler validation
  if (overrides.samplerName !== undefined) {
    if (!SAMPLER_OPTIONS.includes(overrides.samplerName as typeof SAMPLER_OPTIONS[number])) {
      errors.push(`samplerName must be one of: ${SAMPLER_OPTIONS.join(', ')}`);
    }
  }

  // Scheduler validation
  if (overrides.scheduler !== undefined) {
    if (!SCHEDULER_OPTIONS.includes(overrides.scheduler as typeof SCHEDULER_OPTIONS[number])) {
      errors.push(`scheduler must be one of: ${SCHEDULER_OPTIONS.join(', ')}`);
    }
  }

  // Numeric field validations
  const numericValidations: { field: keyof NodeOverrides; min: number; max: number }[] = [
    { field: 'cfg', min: 1, max: 20 },
    { field: 'steps', min: 10, max: 50 },
    { field: 'width', min: 512, max: 2048 },
    { field: 'height', min: 512, max: 2048 },
    { field: 'groomDenoise', min: 0.1, max: 0.9 },
    { field: 'brideDenoise', min: 0.1, max: 0.9 },
    { field: 'handDenoise', min: 0.1, max: 0.9 },
    { field: 'groomSteps', min: 5, max: 25 },
    { field: 'brideSteps', min: 5, max: 25 },
    { field: 'handSteps', min: 5, max: 20 },
    { field: 'groomCfg', min: 1, max: 10 },
    { field: 'brideCfg', min: 1, max: 10 },
    { field: 'handCfg', min: 1, max: 15 },
    { field: 'groomGuideSize', min: 256, max: 1024 },
    { field: 'brideGuideSize', min: 256, max: 1024 },
    { field: 'handGuideSize', min: 256, max: 1024 },
    { field: 'groomLoraStrength', min: 0, max: 2 },
    { field: 'brideLoraStrength', min: 0, max: 2 },
    { field: 'faceThreshold', min: 0.1, max: 0.9 },
    { field: 'handThreshold', min: 0.1, max: 0.9 },
    { field: 'faceDilation', min: 0, max: 50 },
    { field: 'faceCropFactor', min: 1, max: 10 },
    { field: 'handCropFactor', min: 1, max: 10 },
  ];

  for (const { field, min, max } of numericValidations) {
    const value = overrides[field];
    if (value === undefined) continue;

    if (typeof value !== 'number') {
      errors.push(`${field} must be a number`);
      continue;
    }

    if (value < min || value > max) {
      errors.push(`${field} must be between ${min} and ${max}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// =============================================================================
// Database Operations
// =============================================================================

export const insertPromptTest = async (
  supabase: SupabaseClient,
  data: {
    userId: string;
    themeSlug: ThemeSlug;
    shotType: ShotType;
    promptOverrides?: PromptOverrides;
    nodeOverrides?: NodeOverrides;
    seed: number;
    extraStyleTags?: string;
    groomLoraUrl: string;
    brideLoraUrl: string;
    assembledPrompts: AssembledPrompts;
    totalCount: number;
  }
): Promise<HandlerResult<AdminPromptTest, AdminPromptTestError>> => {
  const { data: row, error } = await supabase
    .from('admin_prompt_tests')
    .insert({
      user_id: data.userId,
      theme_slug: data.themeSlug,
      shot_type: data.shotType,
      prompt_overrides: data.promptOverrides ?? null,
      node_overrides: data.nodeOverrides ?? null,
      seed: data.seed,
      extra_style_tags: data.extraStyleTags ?? null,
      groom_lora_url: data.groomLoraUrl,
      bride_lora_url: data.brideLoraUrl,
      images: null,
      generation_time_ms: null,
      assembled_prompts: data.assembledPrompts,
      status: 'queued',
      progress: 0,
      total_count: data.totalCount,
      error_message: null,
      quality_issues: null,
      notes: null,
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting prompt test:', error);
    return failure(500, 'INSERT_ERROR', error.message);
  }

  return success(mapRowToAdminPromptTest(row as AdminPromptTestRow));
};

export const getPromptTestById = async (
  supabase: SupabaseClient,
  testId: string
): Promise<HandlerResult<AdminPromptTest, AdminPromptTestError>> => {
  const { data, error } = await supabase
    .from('admin_prompt_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, 'TEST_NOT_FOUND', 'Test not found');
    }
    console.error('Error fetching prompt test:', error);
    return failure(500, 'FETCH_ERROR', error.message);
  }

  return success(mapRowToAdminPromptTest(data as AdminPromptTestRow));
};

export const getPromptTestHistory = async (
  supabase: SupabaseClient,
  query: PromptTestHistoryQuery
): Promise<HandlerResult<PromptTestHistoryResponse, AdminPromptTestError>> => {
  const { themeSlug, qualityIssue, isFavorite, limit = 20, offset = 0 } = query;

  let queryBuilder = supabase
    .from('admin_prompt_tests')
    .select('*', { count: 'exact' });

  if (themeSlug) {
    queryBuilder = queryBuilder.eq('theme_slug', themeSlug);
  }

  if (isFavorite !== undefined) {
    queryBuilder = queryBuilder.eq('is_favorite', isFavorite);
  }

  if (qualityIssue) {
    queryBuilder = queryBuilder.contains('quality_issues', [qualityIssue]);
  }

  const { data, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching prompt test history:', error);
    return failure(500, 'FETCH_ERROR', error.message);
  }

  const tests = (data as AdminPromptTestRow[]).map(mapRowToAdminPromptTest);
  const total = count ?? 0;

  return success({
    tests,
    total,
    hasMore: offset + tests.length < total,
  });
};

export const updatePromptTest = async (
  supabase: SupabaseClient,
  testId: string,
  updates: PromptTestUpdateRequest
): Promise<HandlerResult<AdminPromptTest, AdminPromptTestError>> => {
  const updateData: Record<string, unknown> = {};

  if (updates.qualityIssues !== undefined) {
    updateData.quality_issues = updates.qualityIssues;
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes;
  }
  if (updates.isFavorite !== undefined) {
    updateData.is_favorite = updates.isFavorite;
  }

  const { data, error } = await supabase
    .from('admin_prompt_tests')
    .update(updateData)
    .eq('id', testId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, 'TEST_NOT_FOUND', 'Test not found');
    }
    console.error('Error updating prompt test:', error);
    return failure(500, 'UPDATE_ERROR', error.message);
  }

  return success(mapRowToAdminPromptTest(data as AdminPromptTestRow));
};

export const deletePromptTest = async (
  supabase: SupabaseClient,
  testId: string
): Promise<HandlerResult<void, AdminPromptTestError>> => {
  const { error } = await supabase
    .from('admin_prompt_tests')
    .delete()
    .eq('id', testId);

  if (error) {
    console.error('Error deleting prompt test:', error);
    return failure(500, 'DELETE_ERROR', error.message);
  }

  return success(undefined);
};

// =============================================================================
// Async Job Status Operations
// =============================================================================

export const getPromptTestStatus = async (
  supabase: SupabaseClient,
  testId: string
): Promise<HandlerResult<PromptTestStatusResponse, AdminPromptTestError>> => {
  const { data, error } = await supabase
    .from('admin_prompt_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, 'TEST_NOT_FOUND', 'Test not found');
    }
    console.error('Error fetching prompt test status:', error);
    return failure(500, 'FETCH_ERROR', error.message);
  }

  const row = data as AdminPromptTestRow;
  return success({
    id: row.id,
    status: row.status,
    progress: row.progress,
    totalCount: row.total_count,
    images: row.images,
    generationTimeMs: row.generation_time_ms,
    errorMessage: row.error_message,
    assembledPrompts: row.assembled_prompts,
    seed: row.seed,
  });
};

export const updatePromptTestProgress = async (
  supabase: SupabaseClient,
  testId: string,
  updates: {
    status?: string;
    progress?: number;
    images?: PromptTestImage[];
    generationTimeMs?: number;
    errorMessage?: string;
  }
): Promise<HandlerResult<void, AdminPromptTestError>> => {
  const updateData: Record<string, unknown> = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.images !== undefined) updateData.images = updates.images;
  if (updates.generationTimeMs !== undefined) updateData.generation_time_ms = updates.generationTimeMs;
  if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;

  const { error } = await supabase
    .from('admin_prompt_tests')
    .update(updateData)
    .eq('id', testId);

  if (error) {
    console.error('Error updating prompt test progress:', error);
    return failure(500, 'UPDATE_ERROR', error.message);
  }

  return success(undefined);
};
