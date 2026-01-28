'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssembledPrompts } from '../types';

// =============================================================================
// Icons
// =============================================================================

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

// =============================================================================
// Types
// =============================================================================

interface ConsoleOutputProps {
  assembledPrompts: AssembledPrompts | null;
  className?: string;
}

interface PromptLineProps {
  nodeId: string;
  label: string;
  value: string;
}

// =============================================================================
// Sub-component: PromptLine
// =============================================================================

const PromptLine = ({ nodeId, label, value }: PromptLineProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value) return null;

  return (
    <div className="group flex items-start gap-2 py-1 hover:bg-muted/50 rounded px-2 -mx-2">
      <span className="text-muted-foreground shrink-0 font-mono text-xs">
        [{nodeId}]
      </span>
      <span className="text-xs font-medium shrink-0">{label}:</span>
      <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
        {value.slice(0, 80)}
        {value.length > 80 && '...'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
};

// =============================================================================
// Component
// =============================================================================

export const ConsoleOutput = ({ assembledPrompts, className }: ConsoleOutputProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [fullCopied, setFullCopied] = useState(false);

  if (!assembledPrompts) {
    return null;
  }

  const handleCopyAll = async () => {
    const text = [
      `[Node 6] Main Positive: ${assembledPrompts.node6MainPositive}`,
      `[Node 7] Main Negative: ${assembledPrompts.node7MainNegative}`,
      `[Node 21] Groom Face: ${assembledPrompts.node21GroomFace}`,
      `[Node 26] Groom Face Negative: ${assembledPrompts.node26GroomFaceNegative}`,
      `[Node 23] Bride Face: ${assembledPrompts.node23BrideFace}`,
      `[Node 27] Bride Face Negative: ${assembledPrompts.node27BrideFaceNegative}`,
      `[Node 38] Hand Positive: ${assembledPrompts.node38HandPositive}`,
      `[Node 39] Hand Negative: ${assembledPrompts.node39HandNegative}`,
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2000);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className="py-2 px-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Console Output
          <span className="text-xs text-muted-foreground font-normal">
            (Assembled Prompts)
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyAll();
            }}
            className="h-7 text-xs"
          >
            {fullCopied ? <CheckIcon /> : <CopyIcon />}
            <span className="ml-1">{fullCopied ? 'Copied!' : 'Copy All'}</span>
          </Button>
          <ChevronDownIcon
            className={cn(
              'transition-transform',
              isExpanded ? 'rotate-180' : ''
            )}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="py-2 px-4 space-y-0 bg-muted/20 font-mono text-xs border-t">
          <PromptLine
            nodeId="Node 6"
            label="Main Positive"
            value={assembledPrompts.node6MainPositive}
          />
          <PromptLine
            nodeId="Node 7"
            label="Main Negative"
            value={assembledPrompts.node7MainNegative}
          />
          <PromptLine
            nodeId="Node 21"
            label="Groom Face"
            value={assembledPrompts.node21GroomFace}
          />
          <PromptLine
            nodeId="Node 26"
            label="Groom Face -"
            value={assembledPrompts.node26GroomFaceNegative}
          />
          <PromptLine
            nodeId="Node 23"
            label="Bride Face"
            value={assembledPrompts.node23BrideFace}
          />
          <PromptLine
            nodeId="Node 27"
            label="Bride Face -"
            value={assembledPrompts.node27BrideFaceNegative}
          />
          <PromptLine
            nodeId="Node 38"
            label="Hand +"
            value={assembledPrompts.node38HandPositive}
          />
          <PromptLine
            nodeId="Node 39"
            label="Hand -"
            value={assembledPrompts.node39HandNegative}
          />
        </CardContent>
      )}
    </Card>
  );
};
