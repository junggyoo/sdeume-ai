'use client';

import {
  DashboardLayout,
  DashboardSidebar,
  useDashboardState,
  useCompletedGenerations,
} from '@/features/dashboard';
import { Card } from '@/components/ui/card';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import FileText from 'lucide-react/dist/esm/icons/file-text';

export default function HelpPage() {
  const { allProjects } = useDashboardState();
  const { pictorials } = useCompletedGenerations(allProjects);

  const galleryCount = pictorials.reduce((sum, p) => sum + p.images.length, 0);
  const hasFaceModel = pictorials.length > 0 || allProjects.length > 0;

  const helpItems = [
    {
      icon: HelpCircle,
      title: '자주 묻는 질문',
      description: '자주 묻는 질문과 답변을 확인하세요',
    },
    {
      icon: FileText,
      title: '사용 가이드',
      description: '스드메 AI 사용법을 단계별로 알아보세요',
    },
    {
      icon: MessageCircle,
      title: '실시간 채팅',
      description: '고객 지원팀과 실시간으로 대화하세요',
    },
    {
      icon: Mail,
      title: '이메일 문의',
      description: 'support@sdeume.ai로 문의해주세요',
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          galleryCount={galleryCount}
          hasFaceModel={hasFaceModel}
          planType="free"
          remainingCount={24}
          totalCount={30}
        />
      }
    >
      <div className="space-y-8">
        <header>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-desktop">
            도움말
          </h1>
          <p className="mt-2 text-muted-foreground">
            궁금한 점이 있으신가요? 도움을 드릴게요
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {helpItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="p-6 cursor-pointer hover:border-primary-desktop/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-desktop/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-desktop" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-desktop">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-primary-desktop/5 border-primary-desktop/20">
          <div className="text-center">
            <h3 className="font-semibold text-primary-desktop mb-2">
              추가 도움이 필요하신가요?
            </h3>
            <p className="text-sm text-muted-foreground">
              평일 오전 10시 ~ 오후 6시에 고객 지원팀이 도와드립니다
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
