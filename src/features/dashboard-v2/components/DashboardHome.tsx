'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lightbulb, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardState } from '@/features/dashboard';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { ProjectCard } from './ProjectCard';
import { FeaturedThemeWidget } from './FeaturedThemeWidget';
import { LookbookCard } from './LookbookCard';
import {
  type DashboardHomeProps,
  type TransformedProject,
  getProjectDisplayStatus,
  formatProjectDate,
} from '../types';
import { ATELIER_COPY, getGreeting } from '../constants';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for lookbook (테마 데이터는 추후 API 연동)
const LOOKBOOK_THEMES = [
  {
    id: 'garden',
    themeName: 'Garden Whisper',
    description: '만개한 수국 사이로 비치는 부드러운 햇살.',
    image:
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=400&fit=crop',
  },
  {
    id: 'midnight',
    themeName: 'Midnight Vogue',
    description: '도시의 하이콘트라스트 플래시 무드.',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&fit=crop',
  },
  {
    id: 'ethereal',
    themeName: 'Ethereal Mist',
    description: '몽환적인 안개와 파스텔 컬러 팔레트.',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&fit=crop',
  },
];

export function DashboardHome({
  onStartNew,
  className,
  isCreating = false,
}: DashboardHomeProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const {
    state: dashboardState,
    processingProject,
    allProjects,
    isLoading,
  } = useDashboardState();

  // 사용자 이름 추출 (메타데이터 또는 이메일에서)
  const userName = useMemo(() => {
    if (!user) return 'Guest';
    const name = user.userMetadata?.name as string | undefined;
    if (name) return name;
    if (user.email) return user.email.split('@')[0];
    return 'Guest';
  }, [user]);

  // 프로젝트 데이터를 ProjectCard 형식으로 변환
  const transformedProjects: TransformedProject[] = useMemo(() => {
    if (!allProjects || allProjects.length === 0) return [];

    return allProjects.map((project) => ({
      id: project.id,
      projectId: project.id,
      title:
        project.name ??
        `촬영 ${new Date(project.createdAt).toLocaleDateString('ko-KR')}`,
      date: formatProjectDate(project.createdAt),
      image: project.latestGeneration?.images?.[0]?.url ?? null,
      status: getProjectDisplayStatus(project),
    }));
  }, [allProjects]);

  // 프로젝트 카드 클릭 핸들러
  const handleProjectClick = (projectId: string, status: string) => {
    switch (status) {
      case 'uploading':
        router.push(`/new-shoot/${projectId}/step2`);
        break;
      case 'theme_selecting':
        router.push(`/new-shoot/${projectId}/step3`);
        break;
      case 'processing':
        router.push(`/new-shoot/${projectId}/progress`);
        break;
      case 'completed':
      case 'failed':
        router.push(`/new-shoot/${projectId}/results`);
        break;
      default:
        router.push(`/new-shoot/${projectId}/step2`);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <main
        data-testid="dashboard-home-loading"
        className={cn(
          'w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20',
          className
        )}
      >
        <div className="lg:col-span-8 flex flex-col gap-12">
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-[32px]" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          <Skeleton className="h-48 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </main>
    );
  }

  return (
    <main
      data-testid="dashboard-home"
      className={cn(
        'w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20',
        className
      )}
    >
      {/* Main Content (8 columns) */}
      <div
        data-testid="main-content"
        className="lg:col-span-8 flex flex-col gap-12"
      >
        {/* Greeting Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight text-gray-900">
            {getGreeting()}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
              {userName}님.
            </span>
          </h1>
          <p className="text-gray-500 font-light flex items-center gap-2 text-lg">
            <Sparkles size={18} className="text-purple-400" />
            {ATELIER_COPY.reception.subtitle}
          </p>
        </motion.section>

        {/* Projects Grid */}
        <div
          data-testid="projects-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* New Project Card - Always First */}
          <ProjectCard
            type="new"
            title={ATELIER_COPY.projectCard.startNewShooting}
            onClick={onStartNew}
            isLoading={isCreating}
          />

          {/* Existing Projects */}
          {transformedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              type="existing"
              projectId={project.projectId}
              title={project.title}
              date={project.date}
              image={project.image}
              status={project.status}
              onClick={() =>
                handleProjectClick(project.projectId, project.status)
              }
            />
          ))}
        </div>

        {/* Curated Lookbook Section */}
        <div
          data-testid="lookbook-section"
          className="pt-8 border-t border-gray-100/50"
        >
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
              {ATELIER_COPY.reception.curatedLookbook}
              <Sparkles className="text-purple-400" size={20} />
            </h2>
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-purple-600 transition-colors font-medium"
            >
              {ATELIER_COPY.reception.viewAll}
            </button>
          </div>

          {/* Horizontal Scroll Gallery */}
          <div className="flex gap-4 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x">
            {LOOKBOOK_THEMES.map((theme) => (
              <LookbookCard
                key={theme.id}
                themeName={theme.themeName}
                description={theme.description}
                image={theme.image}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Side Content (4 columns) */}
      <div
        data-testid="side-content"
        className="lg:col-span-4 space-y-8 pt-8 lg:pt-0"
      >
        {/* Artist's Tip Widget - Glass Morphism */}
        <motion.div
          data-testid="tip-widget"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-lg"
        >
          <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Lightbulb className="text-amber-500 fill-amber-100" size={20} />
            {ATELIER_COPY.widgets.artistTip.title}
          </h3>
          <div className="space-y-3">
            {ATELIER_COPY.widgets.artistTip.tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/50 border border-white/40 hover:bg-white/80 transition-colors"
              >
                <div className="mt-0.5 p-1 rounded-full bg-green-100 text-green-600">
                  <Check size={10} strokeWidth={4} />
                </div>
                <p className="text-sm font-medium text-gray-700 leading-snug">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Featured Theme Widget */}
        <motion.div
          data-testid="theme-widget"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <FeaturedThemeWidget
            themeName="Royal Palace"
            description="왕실 웨딩의 품격을 담아보세요."
            image="https://images.unsplash.com/photo-1546193430-c2d207739ed7?q=80&w=800&fit=crop"
          />
        </motion.div>

        {/* Membership Widget - Dark Gradient */}
        <motion.div
          data-testid="membership-widget"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="group bg-gradient-to-br from-[#191F28] to-[#2D3748] rounded-[32px] p-6 shadow-xl text-white relative overflow-hidden"
        >
          {/* Background Ambient Light */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/30 transition-colors duration-700" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif font-bold">
                {ATELIER_COPY.widgets.membership.title}
              </h3>
              <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase border border-white/10">
                {ATELIER_COPY.widgets.membership.freePlan}
              </span>
            </div>

            {/* Credits Display */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-gray-300 mb-2">
                <span>{ATELIER_COPY.widgets.membership.credits}</span>
                <span>3 / 4</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-white text-[#191F28] font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
            >
              {ATELIER_COPY.widgets.membership.upgrade}
              <Sparkles size={16} className="text-purple-600 fill-purple-200" />
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
