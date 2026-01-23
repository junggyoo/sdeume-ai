'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import User from 'lucide-react/dist/esm/icons/user';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Shield from 'lucide-react/dist/esm/icons/shield';
import LogOut from 'lucide-react/dist/esm/icons/log-out';

export default function SettingsPage() {
  const { user } = useCurrentUser();

  const displayEmail = user?.email ?? '사용자';

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">
          설정
        </h1>
        <p className="mt-2 text-slate-400">
          계정 및 앱 설정을 관리하세요
        </p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <User className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">
              프로필
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">이메일</label>
              <p className="font-medium text-white">{displayEmail}</p>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-200">
              프로필 수정
            </Button>
          </div>
        </Card>

        {/* Notification Section */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">알림</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">이메일 알림</p>
                <p className="text-sm text-slate-400">
                  화보 생성 완료 시 이메일로 알림 받기
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-slate-600 bg-slate-700"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">마케팅 알림</p>
                <p className="text-sm text-slate-400">
                  새로운 테마 및 프로모션 소식 받기
                </p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-600 bg-slate-700"
              />
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">보안</h2>
          </div>
          <div className="space-y-4">
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-200">
              비밀번호 변경
            </Button>
          </div>
        </Card>

        {/* Logout Section */}
        <Card className="p-6 bg-slate-800/50 border-red-900/50">
          <div className="flex items-center gap-4 mb-6">
            <LogOut className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">로그아웃</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              계정에서 로그아웃합니다. 다시 로그인하면 모든 데이터에 접근할 수
              있습니다.
            </p>
            <Button variant="destructive" size="sm">
              로그아웃
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
