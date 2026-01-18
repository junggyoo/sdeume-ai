'use client';

import { PackageCard } from './PackageCard';
import type { Package } from '../types';

interface PackageGridProps {
  packages: Package[];
  selectedPackageId: string;
  onSelect: (packageId: string) => void;
}

export function PackageGrid({
  packages,
  selectedPackageId,
  onSelect,
}: PackageGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          isSelected={selectedPackageId === pkg.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
