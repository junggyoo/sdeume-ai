import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SimpleHeader } from '@/components/shoot/SimpleHeader';
import { LOGIN_PATH } from '@/constants/auth';

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
    <div className="min-h-screen bg-slate-950">
      <SimpleHeader />
      <main>{children}</main>
    </div>
  );
}
