import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  assemblePrompts,
  buildModalRequest,
  validatePromptOverrides,
  validateNodeOverrides,
} from '../admin-prompt-test.service';
import type {
  PromptOverrides,
  NodeOverrides,
} from '@/features/admin-prompt-lab/types';

// =============================================================================
// Mock Theme Config (matches ThemeConfig structure from types.ts)
// =============================================================================

const mockThemeConfig = {
  slug: 'white_studio' as const,
  nameKo: '화이트 스튜디오',
  nameEn: 'White Studio',
  description: 'Clean white studio',
  mainPositive: {
    camera: 'A front-facing full body portrait',
    composition: 'Wide angle shot',
    background: 'Clean white walls',
    atmosphere: 'Elegant and sophisticated',
    lighting: 'Professional softbox lighting',
    groomStyle: 'Black tuxedo with bow tie',
    brideStyle: 'Elegant wedding dress',
    quality: '8k resolution, highly detailed',
  },
  mainNegative: 'illustration, painting, anime, cartoon, 3d render, text, watermark',
  groomFacePositive: 'East Asian facial features, brown eyes, gentle smile',
  groomFaceNegative: 'woman, girl, female, low quality',
  brideFacePositive: 'East Asian facial features, brown eyes, natural bridal makeup',
  brideFaceNegative: 'man, boy, male, low quality',
  handPositive: 'Detailed, natural-looking hands',
  handNegative: '',
  defaultSettings: {
    cfg: 1,
    steps: 25,
    width: 896,
    height: 1152,
  },
};

// =============================================================================
// Tests: assemblePrompts
// =============================================================================

describe('assemblePrompts', () => {
  it('should assemble prompts from theme config with full_body shot type', () => {
    const result = assemblePrompts({
      themeConfig: mockThemeConfig,
      shotType: 'full_body',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
    });

    expect(result.node6MainPositive).toContain('front-facing full body portrait');
    expect(result.node6MainPositive).toContain('Wide angle shot');
    expect(result.node6MainPositive).toContain('Clean white walls');
    expect(result.node7MainNegative).toContain('illustration');
    expect(result.node21GroomFace).toContain('GROOM_SDME');
    expect(result.node21GroomFace).toContain('East Asian facial features');
    expect(result.node23BrideFace).toContain('BRIDE_SDME');
    expect(result.node38HandPositive).toContain('natural-looking hands');
  });

  it('should assemble prompts with closeup shot type', () => {
    const result = assemblePrompts({
      themeConfig: {
        ...mockThemeConfig,
        mainPrompt: {
          ...mockThemeConfig.mainPrompt,
          camera: 'An upper body portrait shot',
          composition: 'Medium close-up focusing on upper body',
        },
      },
      shotType: 'closeup',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
    });

    expect(result.node6MainPositive).toContain('upper body portrait');
    expect(result.node6MainPositive).toContain('Medium close-up');
  });

  it('should apply prompt overrides when provided', () => {
    const promptOverrides: PromptOverrides = {
      mainPositive: 'Custom main positive prompt',
      mainNegative: 'Custom negative prompt',
      groomFacePositive: 'Custom groom face',
      brideFacePositive: 'Custom bride face',
    };

    const result = assemblePrompts({
      themeConfig: mockThemeConfig,
      shotType: 'full_body',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
      promptOverrides,
    });

    expect(result.node6MainPositive).toBe('Custom main positive prompt');
    expect(result.node7MainNegative).toBe('Custom negative prompt');
    expect(result.node21GroomFace).toBe('GROOM_SDME, Custom groom face');
    expect(result.node23BrideFace).toBe('BRIDE_SDME, Custom bride face');
  });

  it('should append extra style tags when provided', () => {
    const result = assemblePrompts({
      themeConfig: mockThemeConfig,
      shotType: 'full_body',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
      extraStyleTags: 'cinematic lighting, bokeh effect',
    });

    expect(result.node6MainPositive).toContain('cinematic lighting');
    expect(result.node6MainPositive).toContain('bokeh effect');
  });

  it('should include main triggers when specified', () => {
    const result = assemblePrompts({
      themeConfig: mockThemeConfig,
      shotType: 'full_body',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
      includeMainTriggers: true,
    });

    expect(result.node6MainPositive).toContain('GROOM_SDME');
    expect(result.node6MainPositive).toContain('BRIDE_SDME');
  });

  it('should handle empty or undefined prompt overrides', () => {
    const result = assemblePrompts({
      themeConfig: mockThemeConfig,
      shotType: 'full_body',
      groomTrigger: 'GROOM_SDME',
      brideTrigger: 'BRIDE_SDME',
      promptOverrides: {
        mainPositive: '',
        handPositive: undefined,
      },
    });

    // Empty string should not override (fall back to theme)
    expect(result.node6MainPositive).toContain('front-facing full body portrait');
    expect(result.node38HandPositive).toContain('natural-looking hands');
  });
});

// =============================================================================
// Tests: buildModalRequest
// =============================================================================

describe('buildModalRequest', () => {
  const baseParams = {
    themeSlug: 'white_studio' as const,
    shotType: 'full_body' as const,
    groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
    brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
  };

  it('should build request with default settings', () => {
    const result = buildModalRequest(baseParams);

    expect(result.groomLoraUrl).toBe(baseParams.groomLoraUrl);
    expect(result.brideLoraUrl).toBe(baseParams.brideLoraUrl);
    expect(result.theme).toBe('white_studio');
    expect(result.shotType).toBe('full_body');
    expect(result.cfg).toBe(1);
    expect(result.steps).toBe(25);
    expect(result.width).toBe(896);
    expect(result.height).toBe(1152);
  });

  it('should apply node overrides', () => {
    const nodeOverrides: NodeOverrides = {
      cfg: 2,
      steps: 30,
      width: 1024,
      height: 1280,
      groomDenoise: 0.5,
      brideDenoise: 0.4,
      handDenoise: 0.3,
    };

    const result = buildModalRequest({
      ...baseParams,
      nodeOverrides,
    });

    expect(result.cfg).toBe(2);
    expect(result.steps).toBe(30);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(1280);
    expect(result.nodeOverrides?.groomDenoise).toBe(0.5);
    expect(result.nodeOverrides?.brideDenoise).toBe(0.4);
    expect(result.nodeOverrides?.handDenoise).toBe(0.3);
  });

  it('should include seed when provided', () => {
    const result = buildModalRequest({
      ...baseParams,
      seed: 12345,
    });

    expect(result.seed).toBe(12345);
  });

  it('should generate random seed when not provided', () => {
    const result = buildModalRequest(baseParams);

    expect(result.seed).toBeDefined();
    expect(typeof result.seed).toBe('number');
    expect(result.seed).toBeGreaterThan(0);
  });

  it('should include extra style tags when provided', () => {
    const result = buildModalRequest({
      ...baseParams,
      extraStyleTags: 'dramatic lighting, moody atmosphere',
    });

    expect(result.extraStyleTags).toBe('dramatic lighting, moody atmosphere');
  });

  it('should include prompt overrides when provided', () => {
    const promptOverrides: PromptOverrides = {
      mainPositive: 'Custom prompt',
    };

    const result = buildModalRequest({
      ...baseParams,
      promptOverrides,
    });

    expect(result.promptOverrides).toEqual(promptOverrides);
  });

  it('should include LoRA strength values from nodeOverrides', () => {
    const nodeOverrides: NodeOverrides = {
      groomLoraStrength: 0.8,
      brideLoraStrength: 1.2,
    };

    const result = buildModalRequest({
      ...baseParams,
      nodeOverrides,
    });

    expect(result.nodeOverrides?.groomLoraStrength).toBe(0.8);
    expect(result.nodeOverrides?.brideLoraStrength).toBe(1.2);
  });

  it('should use default LoRA strength (1.0) when not specified', () => {
    const result = buildModalRequest(baseParams);

    expect(result.groomLoraStrength).toBe(1.0);
    expect(result.brideLoraStrength).toBe(1.0);
  });
});

// =============================================================================
// Tests: validatePromptOverrides
// =============================================================================

describe('validatePromptOverrides', () => {
  it('should accept valid prompt overrides', () => {
    const overrides: PromptOverrides = {
      mainPositive: 'A beautiful portrait',
      mainNegative: 'ugly, blurry',
      groomFacePositive: 'Handsome face',
      groomFaceNegative: 'female',
      brideFacePositive: 'Beautiful face',
      brideFaceNegative: 'male',
      handPositive: 'Detailed hands',
      handNegative: 'extra fingers',
    };

    const result = validatePromptOverrides(overrides);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept empty overrides', () => {
    const result = validatePromptOverrides({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept undefined overrides', () => {
    const result = validatePromptOverrides(undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject prompts that are too long', () => {
    const overrides: PromptOverrides = {
      mainPositive: 'x'.repeat(5001), // Over 5000 char limit
    };

    const result = validatePromptOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('mainPositive exceeds maximum length (5000)');
  });

  it('should reject prompts with prohibited content', () => {
    const overrides: PromptOverrides = {
      mainPositive: 'A nude portrait',
    };

    const result = validatePromptOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('prohibited'))).toBe(true);
  });

  it('should reject non-string values', () => {
    const overrides = {
      mainPositive: 12345, // Should be string
    } as unknown as PromptOverrides;

    const result = validatePromptOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('must be a string'))).toBe(true);
  });
});

// =============================================================================
// Tests: validateNodeOverrides
// =============================================================================

describe('validateNodeOverrides', () => {
  it('should accept valid node overrides', () => {
    const overrides: NodeOverrides = {
      samplerName: 'euler',
      scheduler: 'simple',
      cfg: 1,
      steps: 25,
      width: 896,
      height: 1152,
      groomDenoise: 0.6,
      brideDenoise: 0.6,
      handDenoise: 0.35,
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept empty overrides', () => {
    const result = validateNodeOverrides({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept undefined overrides', () => {
    const result = validateNodeOverrides(undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid sampler name', () => {
    const overrides: NodeOverrides = {
      samplerName: 'invalid_sampler',
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('samplerName'))).toBe(true);
  });

  it('should reject invalid scheduler', () => {
    const overrides: NodeOverrides = {
      scheduler: 'invalid_scheduler',
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('scheduler'))).toBe(true);
  });

  it('should reject cfg out of range', () => {
    const overrides: NodeOverrides = {
      cfg: 25, // Max is 20
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('cfg'))).toBe(true);
  });

  it('should reject steps out of range', () => {
    const overrides: NodeOverrides = {
      steps: 5, // Min is 10
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('steps'))).toBe(true);
  });

  it('should reject denoise out of range', () => {
    const overrides: NodeOverrides = {
      groomDenoise: 1.5, // Max is 0.9
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('groomDenoise'))).toBe(true);
  });

  it('should reject dimensions out of range', () => {
    const overrides: NodeOverrides = {
      width: 256, // Min is 512
      height: 4096, // Max is 2048
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('width'))).toBe(true);
    expect(result.errors.some((e: string) => e.includes('height'))).toBe(true);
  });

  it('should reject non-number values for numeric fields', () => {
    const overrides = {
      cfg: 'one', // Should be number
    } as unknown as NodeOverrides;

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('must be a number'))).toBe(true);
  });

  it('should accept valid LoRA strength values', () => {
    const overrides: NodeOverrides = {
      groomLoraStrength: 0.8,
      brideLoraStrength: 1.5,
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject LoRA strength out of range', () => {
    const overrides: NodeOverrides = {
      groomLoraStrength: 2.5, // Max is 2.0
      brideLoraStrength: -0.5, // Min is 0.0
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('groomLoraStrength'))).toBe(true);
    expect(result.errors.some((e: string) => e.includes('brideLoraStrength'))).toBe(true);
  });

  it('should accept LoRA strength at boundary values (0.0 and 2.0)', () => {
    const overrides: NodeOverrides = {
      groomLoraStrength: 0,
      brideLoraStrength: 2.0,
    };

    const result = validateNodeOverrides(overrides);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
