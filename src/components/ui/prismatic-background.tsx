import { cn } from "@/lib/utils";

interface PrismaticBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  /** Show animated pastel blobs */
  showBlobs?: boolean;
  /** Show subtle grain overlay for depth */
  showGrain?: boolean;
}

/**
 * Antigravity Prismatic White Background
 *
 * 순백색 배경 위에 4개의 파스텔 블롭(pink, blue, violet, peach)이
 * 천천히 떠다니며 영롱한 오로라 효과를 만듭니다.
 */
export function PrismaticBackground({
  children,
  className,
  showBlobs = true,
  showGrain = true,
}: PrismaticBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        className
      )}
      style={{ backgroundColor: "var(--prism-white)" }}
    >
      {/* Pastel Mesh Blobs */}
      {showBlobs && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Pink Blob - Top Left */}
          <div
            className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full opacity-60"
            style={{
              backgroundColor: "var(--prism-pink)",
              filter: "blur(120px)",
              animation: "var(--animate-blob-float)",
            }}
          />

          {/* Blue Blob - Top Right */}
          <div
            className="absolute -right-[5%] top-[20%] h-[700px] w-[700px] rounded-full opacity-50"
            style={{
              backgroundColor: "var(--prism-blue)",
              filter: "blur(120px)",
              animation: "var(--animate-blob-float-delay)",
            }}
          />

          {/* Violet Blob - Center */}
          <div
            className="absolute left-[30%] top-[40%] h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
            style={{
              backgroundColor: "var(--prism-violet)",
              filter: "blur(120px)",
              animation: "var(--animate-blob-float-delay-2)",
            }}
          />

          {/* Peach Blob - Bottom */}
          <div
            className="absolute -bottom-[15%] right-[20%] h-[500px] w-[500px] rounded-full opacity-50"
            style={{
              backgroundColor: "var(--prism-peach)",
              filter: "blur(120px)",
              animation: "var(--animate-blob-float)",
              animationDelay: "-10s",
            }}
          />
        </div>
      )}

      {/* Grain Overlay for depth */}
      {showGrain && (
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
