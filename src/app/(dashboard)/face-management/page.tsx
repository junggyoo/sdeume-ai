'use client';

import { Card } from '@/components/ui/card';
import User from 'lucide-react/dist/esm/icons/user';

export default function FaceManagementPage() {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          내 얼굴 관리
        </h1>
        <p className="mt-2 text-slate-400">
          등록된 얼굴 모델을 관리하세요
        </p>
      </header>

      <Card className="p-8 bg-slate-800/50 border-slate-700">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            얼굴 모델 관리
          </h2>
          <p className="text-slate-400 max-w-md">
            이 기능은 준비 중입니다. 곧 등록된 얼굴 모델을 확인하고 관리할 수
            있습니다.
          </p>
        </div>
      </Card>
    </div>
  );
}
