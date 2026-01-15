'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { ThemeGrid } from '@/features/theme/components/ThemeGrid';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Theme } from '@/features/theme/types';

// Fallback 테마 데이터 (API 실패 시 사용)
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

export default function ThemePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();
  const { data: themes, isLoading, isError } = useThemes();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // 프로젝트 데이터가 로드되면 선택된 테마 설정
  useEffect(() => {
    if (project?.selectedThemeId) {
      setSelectedTheme(project.selectedThemeId);
    }
  }, [project?.selectedThemeId]);

  // 실제 테마 데이터 또는 fallback
  const displayThemes = themes && themes.length > 0 ? themes : FALLBACK_THEMES;

  const handleNext = async () => {
    if (!selectedTheme) return;

    await updateProject.mutateAsync({
      projectId: params.projectId,
      input: {
        currentStep: 4,
        status: 'training',
        selectedThemeId: selectedTheme,
      },
    });
    // Navigate to shooting page (Step 4)
    router.push(`/studio/${params.projectId}/shooting`);
  };

  const handleBack = () => {
    router.push(`/studio/${params.projectId}/optimize`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl font-bold text-primary-desktop">
            테마 선택
          </h2>
          <p className="mt-2 text-gray-600">
            원하는 스튜디오 분위기를 선택해주세요
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-desktop" />
          </div>
        )}

        {/* Theme Grid */}
        {!isLoading && (
          <ThemeGrid
            themes={displayThemes}
            selectedThemeId={selectedTheme}
            onSelect={setSelectedTheme}
          />
        )}

        {/* Lookbook Hint */}
        <p className="text-center text-sm text-gray-500">
          테마를 길게 누르면 더 많은 샘플 사진을 볼 수 있어요
        </p>

        {/* Selected Theme Info */}
        {selectedTheme && (
          <Card className="p-4 bg-primary-desktop/5 border-primary-desktop/20">
            <p className="text-center text-sm text-primary-desktop">
              <strong>
                {displayThemes.find((t) => t.id === selectedTheme)?.name}
              </strong>
              {' '}테마가 선택되었습니다
            </p>
          </Card>
        )}
      </div>

      <StickyCTA
        onNext={handleNext}
        onBack={handleBack}
        nextLabel="완료"
        isNextDisabled={!selectedTheme}
        isLoading={updateProject.isPending}
      />
    </>
  );
}
