'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';
import { PACKAGES, PAYMENT_METHODS } from '../constants';
import type { Package } from '../types';

interface UsePaymentOptions {
  projectId: string;
  defaultPackageId?: string;
}

interface UsePaymentReturn {
  selectedPackageId: string;
  selectedPackage: Package | null;
  selectedPaymentMethodId: string | null;
  expandedPackageId: string;
  isProcessing: boolean;
  canProceed: boolean;
  packages: typeof PACKAGES;
  paymentMethods: typeof PAYMENT_METHODS;
  setSelectedPackageId: (id: string) => void;
  setSelectedPaymentMethodId: (id: string) => void;
  setExpandedPackageId: (id: string) => void;
  handlePayment: () => Promise<void>;
}

export function usePayment({
  projectId,
  defaultPackageId = 'pro',
}: UsePaymentOptions): UsePaymentReturn {
  const router = useRouter();
  const updateProject = useUpdateProject();

  const [selectedPackageId, setSelectedPackageId] = useState<string>(defaultPackageId);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string>(defaultPackageId);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPackage = useMemo(
    () => PACKAGES.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [selectedPackageId]
  );

  const canProceed = selectedPackageId !== null && selectedPaymentMethodId !== null;

  const handlePayment = useCallback(async () => {
    if (!canProceed || isProcessing) return;

    setIsProcessing(true);

    try {
      // Mock 결제 처리: 2초 지연
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 프로젝트 상태 업데이트: 다음 스텝(촬영)으로 이동
      await updateProject.mutateAsync({
        projectId,
        input: {
          currentStep: 4,
          status: 'training',
        },
      });

      // shooting 페이지로 이동
      router.push(`/studio/${projectId}/shooting`);
    } catch (error) {
      console.error('[Payment] Failed to process payment:', error);
      setIsProcessing(false);
    }
  }, [canProceed, isProcessing, projectId, router, updateProject]);

  const handleSelectPackage = useCallback((id: string) => {
    setSelectedPackageId(id);
    setExpandedPackageId(id);
  }, []);

  const handleSelectPaymentMethod = useCallback((id: string) => {
    setSelectedPaymentMethodId(id);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedPackageId(id);
  }, []);

  return {
    selectedPackageId,
    selectedPackage,
    selectedPaymentMethodId,
    expandedPackageId,
    isProcessing,
    canProceed,
    packages: PACKAGES,
    paymentMethods: PAYMENT_METHODS,
    setSelectedPackageId: handleSelectPackage,
    setSelectedPaymentMethodId: handleSelectPaymentMethod,
    setExpandedPackageId: handleToggleExpand,
    handlePayment,
  };
}
