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

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
