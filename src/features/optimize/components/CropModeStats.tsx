'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Image } from 'lucide-react';

interface CropModeStatsProps {
  total: number;
  faceMode: number;
  bodyMode: number;
  original: number;
  className?: string;
}

export function CropModeStats({
  total,
  faceMode,
  bodyMode,
  original,
  className,
}: CropModeStatsProps) {
  const stats = [
    {
      label: '얼굴 포커스',
      count: faceMode,
      percentage: total > 0 ? Math.round((faceMode / total) * 100) : 0,
      icon: ZoomIn,
      color: 'text-primary-desktop',
      bgColor: 'bg-primary-desktop/10',
    },
    {
      label: '상반신 구조',
      count: bodyMode,
      percentage: total > 0 ? Math.round((bodyMode / total) * 100) : 0,
      icon: ZoomOut,
      color: 'text-accent-teal',
      bgColor: 'bg-accent-teal/10',
    },
    {
      label: '원본',
      count: original,
      percentage: total > 0 ? Math.round((original / total) * 100) : 0,
      icon: Image,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <Card className={cn('p-4', className)}>
      <h4 className="text-sm font-medium text-gray-600 mb-3">크롭 모드 분포</h4>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center',
                stat.bgColor
              )}
            >
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <p className="text-lg font-semibold text-gray-800">{stat.count}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={cn('text-xs font-medium', stat.color)}>{stat.percentage}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
