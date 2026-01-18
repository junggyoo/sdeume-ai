import { describe, it, expect } from 'vitest';
import {
  THEME_UI_CONFIGS,
  getThemeUIConfig,
  getThemeWithUI,
} from './theme-ui-config';
import type { Theme, ThemeUIConfig } from '../types';

describe('THEME_UI_CONFIGS', () => {
  it('should have config for white_studio', () => {
    expect(THEME_UI_CONFIGS.white_studio).toBeDefined();
    expect(THEME_UI_CONFIGS.white_studio.nameEn).toBe('White Studio');
    expect(THEME_UI_CONFIGS.white_studio.tagline).toBe(
      '순백의 공간에서 빛나는 두 사람'
    );
    expect(THEME_UI_CONFIGS.white_studio.bgColor).toContain('bg-gradient-to-br');
  });

  it('should have config for garden_studio', () => {
    expect(THEME_UI_CONFIGS.garden_studio).toBeDefined();
    expect(THEME_UI_CONFIGS.garden_studio.nameEn).toBe('Garden Studio');
    expect(THEME_UI_CONFIGS.garden_studio.tagline).toBe(
      '초록빛 정원, 따스한 햇살 아래'
    );
    expect(THEME_UI_CONFIGS.garden_studio.recommendText).toBe(
      '당신의 미소와 찰떡궁합'
    );
  });

  it('should have config for classic_studio', () => {
    expect(THEME_UI_CONFIGS.classic_studio).toBeDefined();
    expect(THEME_UI_CONFIGS.classic_studio.nameEn).toBe('Classic Studio');
    expect(THEME_UI_CONFIGS.classic_studio.tagline).toBe(
      '품격 있는 공간, 특별한 순간'
    );
  });
});

describe('getThemeUIConfig', () => {
  it('should return config for known theme slug', () => {
    const config = getThemeUIConfig('garden_studio');

    expect(config.nameEn).toBe('Garden Studio');
    expect(config.tagline).toBe('초록빛 정원, 따스한 햇살 아래');
  });

  it('should return default config for unknown theme slug', () => {
    const config = getThemeUIConfig('unknown_theme');

    expect(config.nameEn).toBe('Theme');
    expect(config.tagline).toBe('');
    expect(config.bgColor).toBe('bg-gradient-to-br from-gray-300 to-gray-100');
    expect(config.recommendText).toBe('');
  });
});

describe('getThemeWithUI', () => {
  const mockTheme: Theme = {
    id: 'test-id',
    name: '가든 스튜디오',
    slug: 'garden_studio',
    description: '테스트 설명',
    thumbnailUrl: null,
    sampleImages: [],
    tags: ['natural'],
    isRecommended: true,
    displayOrder: 2,
    createdAt: '2024-01-01',
  };

  it('should merge theme with UI config', () => {
    const themeWithUI = getThemeWithUI(mockTheme);

    expect(themeWithUI.id).toBe(mockTheme.id);
    expect(themeWithUI.name).toBe(mockTheme.name);
    expect(themeWithUI.slug).toBe(mockTheme.slug);
    expect(themeWithUI.ui).toBeDefined();
    expect(themeWithUI.ui.nameEn).toBe('Garden Studio');
    expect(themeWithUI.ui.tagline).toBe('초록빛 정원, 따스한 햇살 아래');
  });

  it('should use default UI config for unknown theme', () => {
    const unknownTheme: Theme = {
      ...mockTheme,
      slug: 'unknown_theme',
    };

    const themeWithUI = getThemeWithUI(unknownTheme);

    expect(themeWithUI.ui.nameEn).toBe('Theme');
    expect(themeWithUI.ui.tagline).toBe('');
  });
});
