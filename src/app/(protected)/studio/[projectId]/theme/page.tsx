'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { ThemeGrid } from '@/features/theme/components/ThemeGrid';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

// 최소 로딩 표시 시간 (ms)
const MIN_LOADING_DURATION = 2500;

export default function ThemePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const updateProject = useUpdateProject();
  const { data: themes, isLoading, isError } = useThemes();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // 최소 로딩 시간 보장
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, MIN_LOADING_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // 프로젝트 데이터가 로드되면 선택된 테마 설정
  useEffect(() => {
    if (project?.selectedThemeId) {
      setSelectedTheme(project.selectedThemeId);
    }
  }, [project?.selectedThemeId]);

  // 데이터 로딩 중이거나 최소 로딩 시간이 지나지 않았으면 로딩 화면 표시
  const showLoading = isLoading || !minLoadingComplete;

  // 실제 테마 데이터 또는 fallback
  const displayThemes = themes && themes.length > 0 ? themes : FALLBACK_THEMES;

  const handleNext = async () => {
    if (!selectedTheme) return;

    await updateProject.mutateAsync({
      projectId: params.projectId,
      input: {
        currentStep: 3,
        status: 'training',
        selectedThemeId: selectedTheme,
      },
    });
    // Navigate to shooting page (Step 3)
    router.push(`/studio/${params.projectId}/shooting`);
  };

  const handleBack = () => {
    router.push(`/studio/${params.projectId}/upload`);
  };

  return (
    <AnimatePresence mode="wait">
      {/* 스튜디오 스탠바이 로딩 화면 */}
      {showLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-primary-desktop flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center text-white px-6 max-w-md"
          >
            {/* 로딩 애니메이션 */}
            <div className="w-16 h-16 mx-auto mb-8 animate-pulse">
              <Sparkles className="w-full h-full text-accent-teal" />
            </div>

            {/* 메인 문구 - 세리프, 강조 */}
            <h1 className="font-serif text-2xl md:text-3xl font-bold mb-4">
              AI 디렉터가 촬영 스탠바이를 하고 있습니다...
            </h1>

            {/* 서브 문구 - 작고 부드럽게 */}
            <p className="text-base text-white/70">
              두 분을 가장 돋보이게 할 조명과 구도를 세팅 중이에요.
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
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

            {/* Theme Grid */}
            <ThemeGrid
              themes={displayThemes}
              selectedThemeId={selectedTheme}
              onSelect={setSelectedTheme}
            />

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
