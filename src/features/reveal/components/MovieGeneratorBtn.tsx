'use client';

import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MovieGeneratorBtnProps {
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** WebCodecs 지원 여부 */
  isSupported?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 영상 생성 트리거 버튼
 *
 * 갤러리 하단에 배치되어 무비 영상 생성을 시작하는 버튼
 */
export function MovieGeneratorBtn({
  onClick,
  disabled = false,
  isSupported = true,
  className,
}: MovieGeneratorBtnProps) {
  const isDisabled = disabled || !isSupported;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label="내 무비 영상 만들기"
        className={cn(
          'flex items-center gap-2 rounded-input px-6 py-3',
          'font-sans text-sm font-semibold',
          'transition-colors',
          isDisabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
            : 'bg-accent-rose text-white hover:bg-accent-rose/90 active:bg-accent-rose/80'
        )}
      >
        <Film className="h-4 w-4" />
        내 무비 영상 만들기
      </button>

      {!isSupported && (
        <p className="text-xs text-gray-500">
          이 브라우저에서는 영상 생성을 지원하지 않습니다.
        </p>
      )}
    </div>
  );
}
