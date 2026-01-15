'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useProjects } from '@/features/project/hooks/useProject';
import { useCreateProject } from '@/features/project/hooks/useCreateProject';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStepById, STUDIO_STEPS } from '@/features/studio/types';
import { Plus, Loader2, ImageIcon, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
  uploading: { label: '업로드 중', color: 'bg-blue-100 text-blue-600' },
  optimizing: { label: '최적화 중', color: 'bg-purple-100 text-purple-600' },
  theme_selecting: { label: '테마 선택', color: 'bg-pink-100 text-pink-600' },
  training: { label: '학습 중', color: 'bg-amber-100 text-amber-600' },
  generating: { label: '생성 중', color: 'bg-green-100 text-green-600' },
  completed: { label: '완료', color: 'bg-accent-teal/20 text-accent-teal' },
  failed: { label: '실패', color: 'bg-red-100 text-red-600' },
};

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();

  const handleCreateProject = () => {
    createProject.mutate({ name: '새 프로젝트' });
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[1040px] mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-desktop">
            마이 스튜디오
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.email ?? '사용자'}님, 환영합니다
          </p>
        </header>

        {/* Create Project Button */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary-desktop to-primary-hover text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">새 프로젝트 시작하기</h2>
              <p className="text-sm text-white/80 mt-1">
                AI 웨딩 화보를 만들어보세요
              </p>
            </div>
            <Button
              onClick={handleCreateProject}
              disabled={createProject.isPending}
              className="bg-white text-primary-desktop hover:bg-gray-100"
            >
              {createProject.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              프로젝트 만들기
            </Button>
          </div>
        </Card>

        {/* Projects List */}
        <section>
          <h2 className="font-semibold text-primary-desktop mb-4">
            내 프로젝트
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-desktop" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="mt-4 font-medium text-gray-900">
                아직 프로젝트가 없어요
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                위 버튼을 눌러 첫 프로젝트를 시작해보세요
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const statusInfo = STATUS_LABELS[project.status] || {
                  label: project.status,
                  color: 'bg-gray-100',
                };
                const currentStepInfo = getStepById(project.currentStep);

                return (
                  <Link
                    key={project.id}
                    href={`/studio/${project.id}`}
                    className="block"
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-primary-desktop truncate">
                              {project.name || '제목 없음'}
                            </h3>
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(project.createdAt), 'M월 d일', {
                                locale: ko,
                              })}
                            </span>
                            <span>
                              신랑 {project.groomUploadCount}장 · 신부{' '}
                              {project.brideUploadCount}장
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-teal transition-all"
                                style={{
                                  width: `${(project.currentStep / STUDIO_STEPS.length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {currentStepInfo?.labelKo}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
