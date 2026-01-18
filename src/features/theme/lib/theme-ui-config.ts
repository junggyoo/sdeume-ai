import type { Theme, ThemeUIConfig, ThemeWithUI } from '../types';

export const THEME_UI_CONFIGS: Record<string, ThemeUIConfig> = {
  white_studio: {
    nameEn: 'White Studio',
    tagline: '순백의 공간에서 빛나는 두 사람',
    bgColor: 'bg-gradient-to-br from-gray-200 via-white to-gray-100',
    recommendText: '',
  },
  garden_studio: {
    nameEn: 'Garden Studio',
    tagline: '초록빛 정원, 따스한 햇살 아래',
    bgColor: 'bg-gradient-to-br from-emerald-300 via-green-200 to-lime-100',
    recommendText: '당신의 미소와 찰떡궁합',
  },
  classic_studio: {
    nameEn: 'Classic Studio',
    tagline: '품격 있는 공간, 특별한 순간',
    bgColor: 'bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-100',
    recommendText: '',
  },
};

const DEFAULT_UI_CONFIG: ThemeUIConfig = {
  nameEn: 'Theme',
  tagline: '',
  bgColor: 'bg-gradient-to-br from-gray-300 to-gray-100',
  recommendText: '',
};

export function getThemeUIConfig(slug: string): ThemeUIConfig {
  return THEME_UI_CONFIGS[slug] || DEFAULT_UI_CONFIG;
}

export function getThemeWithUI(theme: Theme): ThemeWithUI {
  return {
    ...theme,
    ui: getThemeUIConfig(theme.slug),
  };
}
