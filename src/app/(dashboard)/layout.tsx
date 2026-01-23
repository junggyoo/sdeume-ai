import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LOGIN_PATH } from '@/constants/auth';
import { AuroraBackground } from '@/components/ui/aurora/AuroraBackground';
import { AppHeader } from '@/components/layout/AppHeader';

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

      {/* Header */}
      <AppHeader variant="light" />

      {/* Main Content */}
      <div className="relative z-10 pt-24 py-12">{children}</div>
    </div>
  );
}
