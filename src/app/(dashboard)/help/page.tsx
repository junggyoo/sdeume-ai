'use client';

import { Card } from '@/components/ui/card';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import FileText from 'lucide-react/dist/esm/icons/file-text';

export default function HelpPage() {
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
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          도움말
        </h1>
        <p className="mt-2 text-slate-400">
          궁금한 점이 있으신가요? 도움을 드릴게요
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="p-6 cursor-pointer bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-violet-900/20 border-violet-700/50">
        <div className="text-center">
          <h3 className="font-semibold text-white mb-2">
            추가 도움이 필요하신가요?
          </h3>
          <p className="text-sm text-slate-400">
            평일 오전 10시 ~ 오후 6시에 고객 지원팀이 도와드립니다
          </p>
        </div>
      </Card>
    </div>
  );
}
