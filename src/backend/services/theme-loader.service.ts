// =============================================================================
// Theme YAML Loader Service
// Loads theme configurations from YAML files in modal/prompts/themes/
// =============================================================================

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { ThemeSlug } from '@/features/shooting/types';
import type {
  ThemeConfig,
  ThemePromptSection,
  WorkflowOverrides,
} from '@/features/admin-prompt-lab/types';

// =============================================================================
// Types for YAML Structure
// =============================================================================

interface ThemeYamlMeta {
  slug: string;
  name_ko: string;
  name_en: string;
  description: string;
}

interface ThemeYamlMain {
  full_body: {
    camera: string;
    composition: string;
  };
  closeup?: {
    camera: string;
    composition: string;
  };
  scene: {
    background: string;
    atmosphere: string;
  };
  lighting: {
    description: string;
  };
  groom_style: {
    attire: string;
    hair: string;
    pose?: string;
    expression?: string;
  };
  bride_style: {
    attire: string;
    hair: string;
    accessories?: string;
    pose?: string;
    expression?: string;
  };
  quality: {
    technical: string;
  };
  negative: {
    style: string;
    quality: string;
    mood: string;
  };
}

interface ThemeYamlFace {
  positive: { core: string } | string;
  negative: { core: string } | string;
}

interface ThemeYamlGeneration {
  cfg: number;
  steps: number;
  width: number;
  height: number;
}

interface ThemeYamlWorkflow {
  preset: string;
  overrides: {
    KSampler?: {
      sampler_name?: string;
      scheduler?: string;
      steps?: number;
      cfg?: number;
    };
    GroomFaceDetailer?: {
      denoise?: number;
      steps?: number;
      cfg?: number;
      guide_size?: number;
    };
    BrideFaceDetailer?: {
      denoise?: number;
      steps?: number;
      cfg?: number;
      guide_size?: number;
    };
    HandDetailer?: {
      denoise?: number;
      steps?: number;
      cfg?: number;
      guide_size?: number;
    };
    Detector?: {
      face_threshold?: number;
      face_dilation?: number;
      face_crop_factor?: number;
      hand_threshold?: number;
      hand_crop_factor?: number;
    };
  };
}

interface ThemeYaml {
  meta: ThemeYamlMeta;
  main: ThemeYamlMain;
  groom_face: ThemeYamlFace;
  bride_face: ThemeYamlFace;
  hand: {
    positive: string;
    negative: string;
  };
  generation: ThemeYamlGeneration;
  workflow?: ThemeYamlWorkflow;
  options?: {
    include_main_triggers?: boolean;
  };
}

// =============================================================================
// Constants
// =============================================================================

const THEME_SLUGS: ThemeSlug[] = ['white_studio', 'garden_studio', 'classic_studio'];

const getThemesDirectory = (): string => {
  // In production/development, resolve from project root
  return path.resolve(process.cwd(), 'modal', 'prompts', 'themes');
};

// =============================================================================
// Cache
// =============================================================================

const themeCache = new Map<ThemeSlug, ThemeConfig>();
let allThemesCache: ThemeConfig[] | null = null;

// =============================================================================
// YAML Parsing Functions
// =============================================================================

const extractFaceCore = (data: { core: string } | string): string => {
  if (typeof data === 'string') return data.trim();
  return data.core;
};

const parseMainPositive = (main: ThemeYamlMain): ThemePromptSection => {
  return {
    camera: main.full_body.camera,
    composition: main.full_body.composition,
    background: main.scene.background,
    atmosphere: main.scene.atmosphere,
    lighting: main.lighting.description,
    groomStyle: [
      main.groom_style.attire,
      main.groom_style.hair,
      main.groom_style.expression ?? main.groom_style.pose,
    ].filter(Boolean).join(', '),
    brideStyle: [
      main.bride_style.attire,
      main.bride_style.hair,
      main.bride_style.accessories,
      main.bride_style.expression ?? main.bride_style.pose,
    ].filter(Boolean).join(', '),
    quality: main.quality.technical,
  };
};

const parseMainNegative = (negative: ThemeYamlMain['negative']): string => {
  return [
    negative.style,
    negative.quality,
    negative.mood,
  ].filter(Boolean).join(', ');
};

const parseWorkflowOverrides = (workflow?: ThemeYamlWorkflow): WorkflowOverrides | undefined => {
  if (!workflow) return undefined;

  return {
    preset: workflow.preset,
    KSampler: workflow.overrides?.KSampler,
    GroomFaceDetailer: workflow.overrides?.GroomFaceDetailer,
    BrideFaceDetailer: workflow.overrides?.BrideFaceDetailer,
    HandDetailer: workflow.overrides?.HandDetailer,
    Detector: workflow.overrides?.Detector,
  };
};

const transformYamlToThemeConfig = (yaml: ThemeYaml): ThemeConfig => {
  return {
    slug: yaml.meta.slug as ThemeSlug,
    nameKo: yaml.meta.name_ko,
    nameEn: yaml.meta.name_en,
    description: yaml.meta.description,
    mainPositive: parseMainPositive(yaml.main),
    mainNegative: parseMainNegative(yaml.main.negative),
    groomFacePositive: extractFaceCore(yaml.groom_face.positive),
    groomFaceNegative: extractFaceCore(yaml.groom_face.negative),
    brideFacePositive: extractFaceCore(yaml.bride_face.positive),
    brideFaceNegative: extractFaceCore(yaml.bride_face.negative),
    handPositive: yaml.hand.positive,
    handNegative: yaml.hand.negative || '',
    defaultSettings: {
      cfg: yaml.generation.cfg,
      steps: yaml.generation.steps,
      width: yaml.generation.width,
      height: yaml.generation.height,
    },
    workflowOverrides: parseWorkflowOverrides(yaml.workflow),
  };
};

// =============================================================================
// Public API
// =============================================================================

/**
 * Load a single theme from its YAML file
 * @throws Error if theme file not found or invalid
 */
export const loadThemeFromYaml = async (themeSlug: ThemeSlug): Promise<ThemeConfig> => {
  const themesDir = getThemesDirectory();
  const filePath = path.join(themesDir, `${themeSlug}.yaml`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Theme file not found: ${filePath}`);
  }

  const yamlContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseYaml(yamlContent) as ThemeYaml;

  return transformYamlToThemeConfig(parsed);
};

/**
 * Load all available themes from YAML files
 * Returns themes sorted by slug
 */
export const loadAllThemes = async (): Promise<ThemeConfig[]> => {
  const themes: ThemeConfig[] = [];

  for (const slug of THEME_SLUGS) {
    try {
      const theme = await loadThemeFromYaml(slug);
      themes.push(theme);
    } catch (error) {
      console.error(`Failed to load theme ${slug}:`, error);
      // Continue loading other themes
    }
  }

  // Sort by slug
  return themes.sort((a, b) => a.slug.localeCompare(b.slug));
};

/**
 * Get a single theme config with caching
 * Returns undefined if theme not found
 */
export const getThemeConfig = async (themeSlug: ThemeSlug): Promise<ThemeConfig | undefined> => {
  // Check cache first
  if (themeCache.has(themeSlug)) {
    return themeCache.get(themeSlug);
  }

  try {
    const theme = await loadThemeFromYaml(themeSlug);
    themeCache.set(themeSlug, theme);
    return theme;
  } catch {
    return undefined;
  }
};

/**
 * Get all theme configs with caching
 */
export const getAllThemeConfigs = async (): Promise<ThemeConfig[]> => {
  // Check cache first
  if (allThemesCache) {
    return allThemesCache;
  }

  const themes = await loadAllThemes();
  allThemesCache = themes;

  // Also populate individual cache
  for (const theme of themes) {
    themeCache.set(theme.slug, theme);
  }

  return themes;
};

/**
 * Clear the theme cache (useful for testing or hot-reloading)
 */
export const clearThemeCache = (): void => {
  themeCache.clear();
  allThemesCache = null;
};
