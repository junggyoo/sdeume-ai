'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface NodeCardProps {
  title: string;
  icon: React.ReactNode;
  nodeIds: string;
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const NodeCard = ({ title, icon, nodeIds, children, className }: NodeCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {nodeIds}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[60%_40%] divide-x">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

interface NodeCardLeftProps {
  children: React.ReactNode;
  className?: string;
}

export const NodeCardLeft = ({ children, className }: NodeCardLeftProps) => (
  <div className={cn('p-4 space-y-4', className)}>
    {children}
  </div>
);

interface NodeCardRightProps {
  children: React.ReactNode;
  className?: string;
}

export const NodeCardRight = ({ children, className }: NodeCardRightProps) => (
  <div className={cn('p-4 space-y-4 bg-muted/10', className)}>
    {children}
  </div>
);
