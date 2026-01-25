import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Prompt Lab | SDEUME',
  description: 'Admin prompt and workflow testing page',
  robots: 'noindex, nofollow',
};

export default function PromptLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
