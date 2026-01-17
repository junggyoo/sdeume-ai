import { cn } from "@/lib/utils";

interface MeshGradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  /** Whether to show the animated blobs */
  showBlobs?: boolean;
}

/**
 * Prismatic White & Liquid Glass 배경 컴포넌트
 *
 * 흰색 배경 위에 파스텔 톤의 거대한 원형(Blob)들이 천천히 부유하는 효과.
 * 햇살이 렌즈에 닿아 생기는 영롱한 플레어(Flare) 혹은 비눗방울 표면 느낌.
 *
 * fixed 포지셔닝으로 스크롤 시에도 배경이 고정됨.
 */
export function MeshGradientBackground({
  children,
  className,
  showBlobs = true,
}: MeshGradientBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-white overflow-hidden", className)}>
      {/* Pastel Mesh Blobs - 콘텐츠 뒤에 배치 (-z-10), 은은하게 (opacity-30, blur-150px) */}
      {showBlobs && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          {/* Color 1: bg-prism-pink - 더 크고 부드럽게 */}
          <div
            className="absolute -left-40 -top-40 h-[750px] w-[750px] rounded-full blur-[150px] opacity-30 animate-blob-float"
            style={{ backgroundColor: "var(--prism-pink)" }}
          />

          {/* Color 2: bg-prism-blue - 우상단 */}
          <div
            className="absolute -right-40 top-20 h-[850px] w-[850px] rounded-full blur-[150px] opacity-30 animate-blob-float-delay"
            style={{ backgroundColor: "var(--prism-blue)" }}
          />

          {/* Color 3: bg-prism-violet - 중앙 하단 */}
          <div
            className="absolute left-1/3 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full blur-[150px] opacity-30 animate-blob-float-delay-2"
            style={{ backgroundColor: "var(--prism-violet)" }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * 섹션용 Mesh Background - 페이지 전체가 아닌 특정 섹션에 적용
 */
export function MeshGradientSection({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Simplified blobs for sections */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full blur-[80px] opacity-40"
          style={{ backgroundColor: "var(--prism-pink)" }}
        />
        <div
          className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full blur-[80px] opacity-40"
          style={{ backgroundColor: "var(--prism-blue)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
