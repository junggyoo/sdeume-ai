'use client';

import { MobilePackageCard } from './MobilePackageCard';
import type { Package } from '../types';

interface MobilePackageListProps {
  packages: Package[];
  selectedPackageId: string;
  expandedPackageId: string;
  onSelect: (packageId: string) => void;
  onToggleExpand: (packageId: string) => void;
}

export function MobilePackageList({
  packages,
  selectedPackageId,
  expandedPackageId,
  onSelect,
  onToggleExpand,
}: MobilePackageListProps) {
  return (
    <div className="space-y-3">
      {packages.map((pkg) => (
        <MobilePackageCard
          key={pkg.id}
          pkg={pkg}
          isSelected={selectedPackageId === pkg.id}
          isExpanded={expandedPackageId === pkg.id}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}
