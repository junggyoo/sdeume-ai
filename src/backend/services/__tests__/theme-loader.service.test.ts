import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadThemeFromYaml,
  loadAllThemes,
  getThemeConfig,
  getAllThemeConfigs,
  clearThemeCache,
} from '../theme-loader.service';
import type { ThemeConfig } from '@/features/admin-prompt-lab/types';

// =============================================================================
// Tests: Theme YAML Loader
// =============================================================================

describe('theme-loader.service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearThemeCache();
  });

  describe('loadThemeFromYaml', () => {
    it('should load and parse white_studio theme', async () => {
      const theme = await loadThemeFromYaml('white_studio');

      expect(theme).toBeDefined();
      expect(theme.slug).toBe('white_studio');
      expect(theme.nameKo).toBe('화이트 스튜디오');
      expect(theme.nameEn).toBe('White Studio');
    });

    it('should parse mainPositive prompt sections correctly', async () => {
      const theme = await loadThemeFromYaml('white_studio');

      expect(theme.mainPositive).toBeDefined();
      expect(theme.mainPositive.camera).toContain('Professional studio portrait');
      expect(theme.mainPositive.composition).toContain('Flexible framing');
      expect(theme.mainPositive.background).toContain('white');
      expect(theme.mainPositive.atmosphere).toBeTruthy();
      expect(theme.mainPositive.lighting).toBeTruthy();
      expect(theme.mainPositive.groomStyle).toBeTruthy();
      expect(theme.mainPositive.brideStyle).toBeTruthy();
      expect(theme.mainPositive.quality).toContain('8k resolution');
    });

    it('should parse face and hand prompts', async () => {
      const theme = await loadThemeFromYaml('white_studio');

      expect(theme.groomFacePositive).toContain('East Asian facial features');
      expect(theme.groomFaceNegative).toContain('woman');
      expect(theme.brideFacePositive).toContain('bridal makeup');
      expect(theme.brideFaceNegative).toContain('man');
      expect(theme.handPositive).toContain('natural-looking hands');
      // Verify flat string face prompts are parsed correctly
      expect(theme.groomFacePositive).toContain('genuine warm smile');
      expect(theme.brideFacePositive).toContain('dewy glowing skin');
    });

    it('should parse generation settings', async () => {
      const theme = await loadThemeFromYaml('white_studio');

      expect(theme.defaultSettings).toBeDefined();
      expect(theme.defaultSettings.cfg).toBe(1);
      expect(theme.defaultSettings.steps).toBe(25);
      expect(theme.defaultSettings.width).toBe(896);
      expect(theme.defaultSettings.height).toBe(1152);
    });

    it('should parse workflow overrides', async () => {
      const theme = await loadThemeFromYaml('white_studio');

      expect(theme.workflowOverrides).toBeDefined();
      expect(theme.workflowOverrides?.preset).toBe('flux_couple_v1');

      // KSampler overrides
      expect(theme.workflowOverrides?.KSampler).toBeDefined();
      expect(theme.workflowOverrides?.KSampler?.sampler_name).toBe('euler');
      expect(theme.workflowOverrides?.KSampler?.scheduler).toBe('simple');

      // Face detailer overrides
      expect(theme.workflowOverrides?.GroomFaceDetailer?.denoise).toBe(0.6);
      expect(theme.workflowOverrides?.BrideFaceDetailer?.steps).toBe(8);

      // Hand detailer overrides
      expect(theme.workflowOverrides?.HandDetailer?.denoise).toBe(0.35);
      expect(theme.workflowOverrides?.HandDetailer?.cfg).toBe(8);

      // Detector settings
      expect(theme.workflowOverrides?.Detector?.face_threshold).toBe(0.25);
      expect(theme.workflowOverrides?.Detector?.hand_threshold).toBe(0.4);
    });

    it('should load garden_studio theme', async () => {
      const theme = await loadThemeFromYaml('garden_studio');

      expect(theme.slug).toBe('garden_studio');
      expect(theme.nameKo).toBe('가든 스튜디오');
      expect(theme.mainPositive.background).toContain('garden');
    });

    it('should load classic_studio theme', async () => {
      const theme = await loadThemeFromYaml('classic_studio');

      expect(theme.slug).toBe('classic_studio');
      expect(theme.nameKo).toBe('클래식 스튜디오');
      expect(theme.mainPositive.background).toContain('ballroom');
    });

    it('should throw error for unknown theme', async () => {
      await expect(loadThemeFromYaml('unknown_theme' as any)).rejects.toThrow();
    });
  });

  describe('loadAllThemes', () => {
    it('should load all available themes', async () => {
      const themes = await loadAllThemes();

      expect(themes).toHaveLength(3);
      expect(themes.map(t => t.slug)).toContain('white_studio');
      expect(themes.map(t => t.slug)).toContain('garden_studio');
      expect(themes.map(t => t.slug)).toContain('classic_studio');
    });

    it('should return themes sorted by slug', async () => {
      const themes = await loadAllThemes();

      const slugs = themes.map(t => t.slug);
      expect(slugs).toEqual(['classic_studio', 'garden_studio', 'white_studio']);
    });
  });

  describe('getThemeConfig (cached)', () => {
    it('should return cached theme after first load', async () => {
      // First call - loads from file
      const theme1 = await getThemeConfig('white_studio');
      // Second call - should use cache
      const theme2 = await getThemeConfig('white_studio');

      expect(theme1).toBe(theme2); // Same reference (cached)
    });

    it('should return undefined for unknown theme', async () => {
      const theme = await getThemeConfig('unknown_theme' as any);
      expect(theme).toBeUndefined();
    });
  });

  describe('getAllThemeConfigs (cached)', () => {
    it('should return all themes cached', async () => {
      const themes1 = await getAllThemeConfigs();
      const themes2 = await getAllThemeConfigs();

      expect(themes1).toHaveLength(3);
      expect(themes1).toBe(themes2); // Same reference (cached)
    });
  });

  describe('clearThemeCache', () => {
    it('should clear the cache', async () => {
      // Load to populate cache
      const theme1 = await getThemeConfig('white_studio');

      // Clear cache
      clearThemeCache();

      // Load again - should be a new object
      const theme2 = await getThemeConfig('white_studio');

      expect(theme1).not.toBe(theme2); // Different references
      expect(theme1?.slug).toBe(theme2?.slug); // Same content
    });
  });
});
