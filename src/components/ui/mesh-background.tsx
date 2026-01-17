import { cn } from "@/lib/utils";

interface MeshGradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  /** Whether to show the animated blobs */
  showBlobs?: boolean;
  /** Additional overlay intensity (0-1) */
  overlayIntensity?: number;
}

/**
 * Prismatic White & Liquid Glass 배경 컴포넌트
 *
 * 흰색 배경 위에 파스텔 톤의 거대한 원형(Blob)들이 천천히 부유하는 효과.
 * 햇살이 렌즈에 닿아 생기는 영롱한 플레어(Flare) 혹은 비눗방울 표면 느낌.
 */
export function MeshGradientBackground({
  children,
  className,
  showBlobs = true,
  overlayIntensity = 0.4,
}: MeshGradientBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-white overflow-hidden", className)}>
      {/* Pastel Mesh Blobs */}
      {showBlobs && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Color 1: bg-prism-pink */}
          <div
            className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-prism-pink blur-3xl opacity-40 animate-blob"
          />

          {/* Color 2: bg-prism-blue */}
          <div
            className="absolute -right-20 top-40 h-[600px] w-[600px] rounded-full bg-prism-blue blur-3xl opacity-40 animate-blob-delay"
          />

          {/* Color 3: bg-prism-violet */}
          <div
            className="absolute left-1/3 top-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-prism-violet blur-3xl opacity-40 animate-blob-delay-2"
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
  blobColors = ['prism-pink', 'prism-blue', 'prism-violet'],
}: {
  children?: React.ReactNode;
  className?: string;
  blobColors?: string[];
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Simplified blobs for sections */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-10 -top-10 h-[300px] w-[300px] rounded-full bg-prism-pink/30 blur-3xl"
        />
        <div
          className="absolute -right-10 -bottom-10 h-[350px] w-[350px] rounded-full bg-prism-blue/30 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
