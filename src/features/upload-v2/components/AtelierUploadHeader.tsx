'use client';

import { useRouter } from 'next/navigation';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import type { UploadRole } from '@/features/upload/types';
import { AtelierRoleSwitcher } from './AtelierRoleSwitcher';

interface AtelierUploadHeaderProps {
  activeRole: UploadRole;
  onRoleChange: (role: UploadRole) => void;
  groomCount: number;
  brideCount: number;
  hasBothFaces?: boolean;
}

export function AtelierUploadHeader({
  activeRole,
  onRoleChange,
  groomCount,
  brideCount,
  hasBothFaces = false,
}: AtelierUploadHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      {/* Left: Back button & Title */}
      <div>
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-gray-900 text-sm mb-4 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} />
          대시보드로 돌아가기
        </button>
        <h1 className="text-3xl md:text-5xl font-serif text-gray-900">
          얼굴 사진을
          <br className="md:hidden" />
          <span className="italic text-purple-600"> 등록해주세요.</span>
        </h1>
        {hasBothFaces && (
          <p className="text-sm text-amber-600 mt-3">
            기존 얼굴 모델이 있습니다. 새로운 사진을 업로드하면 모델이
            업데이트됩니다.
          </p>
        )}
      </div>

      {/* Right: Role Switcher */}
      <AtelierRoleSwitcher
        activeRole={activeRole}
        onRoleChange={onRoleChange}
        groomCount={groomCount}
        brideCount={brideCount}
      />
    </div>
  );
}
