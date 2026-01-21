'use client';

import { useParams, useRouter } from 'next/navigation';
import PaymentStage from '@/components/PaymentStage';

export default function Step3Page() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/new-shoot/${params.projectId}/step2`);
  };

  const handleNext = () => {
    // TODO: Integrate with payment API before navigating
    router.push(`/new-shoot/${params.projectId}/progress`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PaymentStage onBack={handleBack} onNext={handleNext} />
    </div>
  );
}
