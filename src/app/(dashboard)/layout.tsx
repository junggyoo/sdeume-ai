import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LOGIN_PATH } from '@/constants/auth';
import { AuroraBackground } from '@/components/ui/aurora/AuroraBackground';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Aurora Background */}
      <AuroraBackground />

      {/* Main Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
