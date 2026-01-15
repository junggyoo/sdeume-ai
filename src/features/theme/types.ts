export interface Theme {
  id: string;
  name: string; // display_name_ko from DB
  slug: string; // name from DB (e.g., 'white_studio')
  description: string | null;
  thumbnailUrl: string | null;
  sampleImages: string[];
  tags: string[];
  isRecommended: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ThemeWithDetails extends Theme {
  lookbookImages: string[];
  stylePrompt: string | null;
}

// DB에서 snake_case로 오는 데이터를 camelCase로 변환
export interface ThemeRow {
  id: string;
  name: string; // slug (e.g., 'white_studio')
  display_name_ko: string;
  description_ko: string | null;
  thumbnail_url: string | null;
  config: {
    sample_urls?: string[];
  } | null;
  recommendation_tags: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function mapThemeRowToTheme(row: ThemeRow): Theme {
  return {
    id: row.id,
    name: row.display_name_ko,
    slug: row.name,
    description: row.description_ko,
    thumbnailUrl: row.thumbnail_url,
    sampleImages: row.config?.sample_urls || [],
    tags: row.recommendation_tags || [],
    isRecommended: row.sort_order === 2, // garden_studio를 기본 추천으로
    displayOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
