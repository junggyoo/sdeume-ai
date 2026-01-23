import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LOGIN_PATH } from '@/constants/auth';
import { AppHeader } from '@/components/layout/AppHeader';

export default async function ShootGroupLayout({
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
    <div className="min-h-screen">
      <AppHeader variant="light" />
      <main>{children}</main>
    </div>
  );
}
