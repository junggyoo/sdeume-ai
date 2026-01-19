'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useSmartNavigation } from '@/features/shoot/hooks/useSmartNavigation';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { getThemeWithUI } from '@/features/theme/lib/theme-ui-config';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import {
  ThemeCarousel,
  DarkThemeGrid,
  FaceOverlayToggle,
  SampleModal,
} from '@/features/theme/components/theme-selection';
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
  const [faceOverlay, setFaceOverlay] = useState(false);
  const [detailTheme, setDetailTheme] = useState<ThemeWithUI | null>(null);

  useEffect(() => {
    if (project?.selectedThemeId) {
      setSelectedTheme(project.selectedThemeId);
    }
  }, [project?.selectedThemeId]);

  const baseThemes = themes && themes.length > 0 ? themes : FALLBACK_THEMES;
  const themesWithUI: ThemeWithUI[] = baseThemes.map(getThemeWithUI);

  const selectedThemeData = selectedTheme
    ? themesWithUI.find((t) => t.id === selectedTheme)
    : null;

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleViewSamples = (theme: ThemeWithUI) => {
    setDetailTheme(theme);
  };

  const handleCloseModal = () => {
    setDetailTheme(null);
  };

  const handleSelectFromModal = () => {
    if (detailTheme) {
      setSelectedTheme(detailTheme.id);
      setDetailTheme(null);
    }
  };

  const handleToggleFaceOverlay = () => {
    setFaceOverlay((prev) => !prev);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white/60">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-[1040px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left spacer for balance */}
            <div className="w-10 md:w-20" />

            <div className="text-center">
              <h1 className="text-lg font-bold text-white">컨셉을 선택하세요</h1>
            </div>

            <FaceOverlayToggle
              enabled={faceOverlay}
              onToggle={handleToggleFaceOverlay}
              variant="header"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1040px] mx-auto pt-8 pb-6">
        <ThemeCarousel
          themes={themesWithUI}
          selectedThemeId={selectedTheme}
          faceOverlay={faceOverlay}
          onSelect={handleSelectTheme}
          onViewSamples={handleViewSamples}
        />

        <div className="px-4 md:px-0">
          <DarkThemeGrid
            themes={themesWithUI}
            selectedThemeId={selectedTheme}
            faceOverlay={faceOverlay}
            onSelect={handleSelectTheme}
            onViewSamples={handleViewSamples}
          />
        </div>
      </main>

      <AnimatePresence>
        {detailTheme && (
          <SampleModal
            theme={detailTheme}
            isOpen={!!detailTheme}
            onClose={handleCloseModal}
            onSelect={handleSelectFromModal}
          />
        )}
      </AnimatePresence>

      <StickyCTA
        onNext={handleNext}
        onBack={handleBack}
        nextLabel="다음 단계로"
        isNextDisabled={!selectedTheme}
        isLoading={updateProject.isPending}
        variant="dark"
        selectedTheme={
          selectedThemeData
            ? {
                name: selectedThemeData.name,
                bgColor: selectedThemeData.ui.bgColor,
              }
            : undefined
        }
      />
    </div>
  );
}
