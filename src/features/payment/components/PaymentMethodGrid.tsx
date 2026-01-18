'use client';

import { PaymentMethodButton } from './PaymentMethodButton';
import type { PaymentMethod } from '../types';

interface PaymentMethodGridProps {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  onSelect: (methodId: string) => void;
}

export function PaymentMethodGrid({
  methods,
  selectedMethodId,
  onSelect,
}: PaymentMethodGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((method) => (
        <PaymentMethodButton
          key={method.id}
          method={method}
          isSelected={selectedMethodId === method.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
