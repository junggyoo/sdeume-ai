'use client';

import {
  DashboardLayout,
  DashboardSidebar,
  useDashboardState,
  useCompletedGenerations,
} from '@/features/dashboard';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import User from 'lucide-react/dist/esm/icons/user';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Shield from 'lucide-react/dist/esm/icons/shield';
import LogOut from 'lucide-react/dist/esm/icons/log-out';

export default function SettingsPage() {
  const { user } = useCurrentUser();
  const { allProjects } = useDashboardState();
  const { pictorials } = useCompletedGenerations(allProjects);

  const galleryCount = pictorials.reduce((sum, p) => sum + p.images.length, 0);
  const hasFaceModel = pictorials.length > 0 || allProjects.length > 0;

  const displayEmail = user?.email ?? '사용자';

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
            설정
          </h1>
          <p className="mt-2 text-muted-foreground">
            계정 및 앱 설정을 관리하세요
          </p>
        </header>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <User className="w-5 h-5 text-primary-desktop" />
              <h2 className="text-lg font-semibold text-primary-desktop">
                프로필
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">이메일</label>
                <p className="font-medium">{displayEmail}</p>
              </div>
              <Button variant="outline" size="sm">
                프로필 수정
              </Button>
            </div>
          </Card>

          {/* Notification Section */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Bell className="w-5 h-5 text-primary-desktop" />
              <h2 className="text-lg font-semibold text-primary-desktop">
                알림
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">이메일 알림</p>
                  <p className="text-sm text-muted-foreground">
                    화보 생성 완료 시 이메일로 알림 받기
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">마케팅 알림</p>
                  <p className="text-sm text-muted-foreground">
                    새로운 테마 및 프로모션 소식 받기
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Shield className="w-5 h-5 text-primary-desktop" />
              <h2 className="text-lg font-semibold text-primary-desktop">
                보안
              </h2>
            </div>
            <div className="space-y-4">
              <Button variant="outline" size="sm">
                비밀번호 변경
              </Button>
            </div>
          </Card>

          {/* Logout Section */}
          <Card className="p-6 border-red-200">
            <div className="flex items-center gap-4 mb-6">
              <LogOut className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-500">
                로그아웃
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                계정에서 로그아웃합니다. 다시 로그인하면 모든 데이터에 접근할 수 있습니다.
              </p>
              <Button variant="destructive" size="sm">
                로그아웃
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
