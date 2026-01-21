import { AuroraBackground } from '@/features/upload-v2/components/AuroraBackground';

export default function Step1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground />

      {/* Light theme override for header */}
      <style>{`
        header.sticky {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(20px) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        header.sticky a, header.sticky span, header.sticky div {
          color: #374151 !important;
        }
        header.sticky a:hover {
          color: #111827 !important;
        }
        header.sticky div.bg-white {
          background: #9333EA !important;
        }
        header.sticky div.bg-slate-700 {
          background: #E5E7EB !important;
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
