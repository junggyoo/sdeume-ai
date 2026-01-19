'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FreeTrialLinkProps {
  projectId: string;
}

export function FreeTrialLink({ projectId }: FreeTrialLinkProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-slate-400 mb-1">아직 고민되시나요?</p>
      <Link
        href={`/studio/${projectId}/shooting?plan=free`}
        className="inline-flex items-center gap-1 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
      >
        무료로 4장 먼저 찍어보기
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
