'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/features/project/hooks/useProject';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { usePayment } from '@/features/payment/hooks/usePayment';
import {
  PackageGrid,
  MobilePackageList,
  PaymentMethodGrid,
  OrderSummary,
  RefundGuarantee,
  FreeTrialLink,
  SelectedThemeCard,
  EarlyBirdBanner,
} from '@/features/payment/components';
import { StickyCTA } from '@/features/studio/components/StickyCTA';
import { FALLBACK_THEMES } from '@/features/payment/constants';
import { Button } from '@/components/ui/button';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export default function Step3Page() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useProject(params.projectId);
  const { data: themes } = useThemes();

  const {
    selectedPackageId,
    selectedPackage,
    selectedPaymentMethodId,
    expandedPackageId,
    isProcessing,
    canProceed,
    packages,
    paymentMethods,
    setSelectedPackageId,
    setSelectedPaymentMethodId,
    setExpandedPackageId,
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

  const handleBack = () => {
    router.push(`/new-shoot/${params.projectId}/step2`);
  };

  const handleChangeTheme = () => {
    router.push(`/new-shoot/${params.projectId}/step2`);
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-[1040px] mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-bold text-white">패키지 선택</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1040px] mx-auto py-6">
        {/* Mobile Layout */}
        <div className="lg:hidden px-4 space-y-6">
          <SelectedThemeCard
            theme={selectedTheme}
            onChangeTheme={handleChangeTheme}
          />

          <section>
            <h2 className="text-sm font-bold text-white mb-3">패키지 선택</h2>
            <MobilePackageList
              packages={packages}
              selectedPackageId={selectedPackageId}
              expandedPackageId={expandedPackageId}
              onSelect={setSelectedPackageId}
              onToggleExpand={setExpandedPackageId}
            />
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-3">결제 수단</h2>
            <PaymentMethodGrid
              methods={paymentMethods}
              selectedMethodId={selectedPaymentMethodId}
              onSelect={setSelectedPaymentMethodId}
            />
          </section>

          <EarlyBirdBanner />

          <RefundGuarantee variant="dark" />

          <FreeTrialLink projectId={params.projectId} />

          {selectedPackage && (
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div>
                <span className="text-sm text-slate-400">총 결제금액</span>
                <span className="text-sm text-slate-500 line-through ml-2">
                  {selectedPackage.originalPrice.toLocaleString()}원
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400">
                  {selectedPackage.price.toLocaleString()}원
                </span>
                <span className="text-xs text-rose-400 font-medium">
                  {selectedPackage.discount}% 할인
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block px-4">
          <div className="flex gap-8">
            <div className="flex-1 space-y-8">
              <section>
                <PackageGrid
                  packages={packages}
                  selectedPackageId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                />
              </section>

              <section>
                <h2 className="text-lg font-bold text-white mb-4">결제 수단</h2>
                <PaymentMethodGrid
                  methods={paymentMethods}
                  selectedMethodId={selectedPaymentMethodId}
                  onSelect={setSelectedPaymentMethodId}
                />
              </section>

              <EarlyBirdBanner />
            </div>

            <div className="w-[360px] space-y-4">
              <OrderSummary
                theme={selectedTheme}
                selectedPackage={selectedPackage}
                variant="dark"
              />

              <Button
                size="lg"
                onClick={handlePayment}
                disabled={!canProceed || isProcessing}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    결제 처리 중...
                  </>
                ) : (
                  <>
                    결제하고 촬영 시작
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>

              <FreeTrialLink projectId={params.projectId} />
            </div>
          </div>
        </div>
      </main>

      <StickyCTA
        onNext={handlePayment}
        onBack={handleBack}
        nextLabel={isProcessing ? '결제 처리 중...' : '결제하고 촬영 시작'}
        isNextDisabled={!canProceed || isProcessing}
        isLoading={isProcessing}
        variant="dark"
      />
    </div>
  );
}
