import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { LOGIN_PATH } from '@/constants/auth';

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
    <div className="min-h-screen bg-slate-950">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[280px] min-h-screen p-4 sticky top-0">
          <DashboardSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
