'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { usePayment } from '@/features/payment/hooks/usePayment';
import {
  PackageGrid,
  PaymentMethodGrid,
  RefundGuarantee,
  FreeTrialLink,
  SelectedThemeCard,
  EarlyBirdBanner,
  PaymentBottomBar,
} from '@/features/payment/components';
import { FALLBACK_THEMES } from '@/features/payment/constants';

export default function Step3Page() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const { data: themes } = useThemes();

  const {
    selectedPackageId,
    selectedPackage,
    selectedPaymentMethodId,
    isProcessing,
    canProceed,
    packages,
    paymentMethods,
    setSelectedPackageId,
    setSelectedPaymentMethodId,
    handlePayment,
  } = usePayment({
    projectId: params.projectId,
    defaultPackageId: 'pro',
  });

  const selectedTheme = (() => {
    if (!project?.selectedThemeId) return null;

    const themeFromApi = themes?.find((t) => t.id === project.selectedThemeId);
    if (themeFromApi) {
      return {
        id: themeFromApi.id,
        name: themeFromApi.name,
        thumbnailUrl: themeFromApi.thumbnailUrl,
      };
    }

    const fallbackTheme = FALLBACK_THEMES.find(
      (t) => t.id === project.selectedThemeId
    );
    if (fallbackTheme) {
      return {
        id: fallbackTheme.id,
        name: fallbackTheme.name,
        thumbnailUrl: fallbackTheme.thumbnailUrl,
      };
    }

    return null;
  })();

  const handleChangeTheme = () => {
    router.push(`/new-shoot/${params.projectId}/step2`);
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-bold text-white">패키지 선택</h1>
          </div>
        </div>
      </header>

      {/* Content - Unified Layout */}
      <main className="max-w-5xl mx-auto py-6 px-4">
        <div className="space-y-8">
          {/* Selected Theme Card */}
          <SelectedThemeCard
            theme={selectedTheme}
            onChangeTheme={handleChangeTheme}
          />

          {/* Package Selection */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">패키지 선택</h2>
            <PackageGrid
              packages={packages}
              selectedPackageId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />
          </section>

          {/* Payment Methods */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">결제 수단</h2>
            <PaymentMethodGrid
              methods={paymentMethods}
              selectedMethodId={selectedPaymentMethodId}
              onSelect={setSelectedPaymentMethodId}
            />
          </section>

          {/* Early Bird Banner */}
          <EarlyBirdBanner />

          {/* Refund Guarantee */}
          <RefundGuarantee variant="dark" />

          {/* Free Trial Link */}
          <FreeTrialLink projectId={params.projectId} />
        </div>
      </main>

      {/* Bottom Sticky Bar */}
      <PaymentBottomBar
        selectedPackage={selectedPackage}
        onPayment={handlePayment}
        isProcessing={isProcessing}
        canProceed={canProceed}
      />
    </div>
  );
}
