'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useSmartNavigation } from '@/features/shoot/hooks/useSmartNavigation';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { getThemeWithUI } from '@/features/theme/lib/theme-ui-config';
import { ThemeSelectionStage } from '@/features/theme/components/theme-selection';
import type { Theme, ThemeWithUI } from '@/features/theme/types';

const FALLBACK_THEMES: Theme[] = [
  {
    id: 'white_studio',
    name: '화이트 스튜디오',
    slug: 'white_studio',
    description: '깔끔하고 미니멀한 자연광 스튜디오',
    thumbnailUrl: null,
    sampleImages: [],
    tags: ['clean', 'minimal', 'bright'],
    isRecommended: false,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'garden_studio',
    name: '가든 스튜디오',
    slug: 'garden_studio',
    description: '초록 정원과 따뜻한 햇살, 아름다운 보케',
    thumbnailUrl: null,
    sampleImages: [],
    tags: ['smile', 'warm', 'natural'],
    isRecommended: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'classic_studio',
    name: '클래식 스튜디오',
    slug: 'classic_studio',
    description: '웅장한 샹들리에와 호텔 예식 분위기',
    thumbnailUrl: null,
    sampleImages: [],
    tags: ['elegant', 'formal', 'luxury'],
    isRecommended: false,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
];

export default function Step2Page() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();
  const { data: themes, isLoading } = useThemes();
  const { goBackFromStep2 } = useSmartNavigation();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (project?.selectedThemeId) {
      setSelectedTheme(project.selectedThemeId);
    }
  }, [project?.selectedThemeId]);

  const baseThemes = themes && themes.length > 0 ? themes : FALLBACK_THEMES;
  const themesWithUI: ThemeWithUI[] = baseThemes.map(getThemeWithUI);

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleNext = async () => {
    if (!selectedTheme) return;

    await updateProject.mutateAsync({
      projectId: params.projectId,
      input: {
        currentStep: 3,
        status: 'theme_selecting',
        selectedThemeId: selectedTheme,
      },
    });
    router.push(`/new-shoot/${params.projectId}/step3`);
  };

  const handleBack = goBackFromStep2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ThemeSelectionStage
        themes={themesWithUI}
        selectedThemeId={selectedTheme}
        onSelectTheme={handleSelectTheme}
        onNext={handleNext}
        onBack={handleBack}
        isLoading={updateProject.isPending}
        isNextDisabled={!selectedTheme}
      />
    </div>
  );
}
