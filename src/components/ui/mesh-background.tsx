import { cn } from "@/lib/utils";
import { ParticleBackground } from "./particle-background";

interface MeshGradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  /** Whether to show the particle effect */
  showParticles?: boolean;
}

/**
 * The Atelier of Dreams 배경 컴포넌트
 *
 * 순백 배경(#FAFAFA) 위에 미세한 파티클이 천천히 부유하는 효과.
 * 오로라 효과는 각 섹션에서 개별적으로 처리.
 */
export function MeshGradientBackground({
  children,
  className,
  showParticles = true,
}: MeshGradientBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-[#FAFAFA] text-gray-900 selection:bg-purple-200 selection:text-black",
        className
      )}
    >
      {/* Particle Background */}
      {showParticles && <ParticleBackground particleCount={60} opacity={0.4} />}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 섹션용 Background - 페이지 전체가 아닌 특정 섹션에 적용
 */
export function MeshGradientSection({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#FAFAFA]", className)}>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
