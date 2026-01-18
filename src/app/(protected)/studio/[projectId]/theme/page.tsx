'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
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
  const { data: themes, isLoading } = useThemes();

  // Local state
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [faceOverlay, setFaceOverlay] = useState(false);
  const [detailTheme, setDetailTheme] = useState<ThemeWithUI | null>(null);

  // 프로젝트 데이터가 로드되면 선택된 테마 설정
  useEffect(() => {
    if (project?.selectedThemeId) {
      setSelectedTheme(project.selectedThemeId);
    }
  }, [project?.selectedThemeId]);

  // 실제 테마 데이터 또는 fallback (ThemeWithUI로 변환)
  const baseThemes = themes && themes.length > 0 ? themes : FALLBACK_THEMES;
  const themesWithUI: ThemeWithUI[] = baseThemes.map(getThemeWithUI);

  // 선택된 테마 정보
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
    router.push(`/studio/${params.projectId}/payment`);
  };

  const handleBack = () => {
    router.push(`/studio/${params.projectId}/upload`);
  };

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
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-[1040px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-white/60 text-sm hidden md:inline">
                마이 스튜디오
              </span>
            </div>

            {/* Center: Step indicator */}
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                STEP 1 OF 3
              </p>
              <h1 className="text-lg font-bold text-white mt-0.5">
                컨셉을 선택하세요
              </h1>
            </div>

            {/* Right: Face Overlay Toggle */}
            <FaceOverlayToggle
              enabled={faceOverlay}
              onToggle={handleToggleFaceOverlay}
              variant="header"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1040px] mx-auto py-6">
        {/* Mobile Carousel */}
        <ThemeCarousel
          themes={themesWithUI}
          selectedThemeId={selectedTheme}
          faceOverlay={faceOverlay}
          onSelect={handleSelectTheme}
          onViewSamples={handleViewSamples}
        />

        {/* Desktop Grid */}
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

      {/* Sample Modal */}
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

      {/* Sticky CTA */}
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
