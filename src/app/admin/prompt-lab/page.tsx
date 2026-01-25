'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  NodeCard,
  NodeCardLeft,
  NodeCardRight,
} from '@/features/admin-prompt-lab/components/NodeCard';
import { PromptInput } from '@/features/admin-prompt-lab/components/PromptInput';
import { SliderSetting } from '@/features/admin-prompt-lab/components/SliderSetting';
import { PreviewPanel } from '@/features/admin-prompt-lab/components/PreviewPanel';
import { ConsoleOutput } from '@/features/admin-prompt-lab/components/ConsoleOutput';
import { usePromptTest } from '@/features/admin-prompt-lab/hooks/usePromptTest';
import { useThemeConfig } from '@/features/admin-prompt-lab/hooks/useThemeConfig';
import {
  DEFAULT_NODE_SETTINGS,
  SAMPLER_OPTIONS,
  SCHEDULER_OPTIONS,
  QUALITY_ISSUES,
} from '@/features/admin-prompt-lab/types';
import type {
  PromptOverrides,
  NodeOverrides,
  QualityIssueId,
} from '@/features/admin-prompt-lab/types';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Icons
// =============================================================================

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"/>
    <circle cx="17.5" cy="10.5" r=".5"/>
    <circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

const HandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

const DiceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="12" height="12" x="2" y="10" rx="2" ry="2"/>
    <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/>
    <path d="M6 18h.01"/>
    <path d="M10 14h.01"/>
    <path d="M15 6h.01"/>
    <path d="M18 9h.01"/>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

// =============================================================================
// Page Component
// =============================================================================

export default function PromptLabPage() {
  // Theme config
  const { themes, selectedTheme, selectTheme } = useThemeConfig();

  // Generation state
  const [shotType, setShotType] = useState<ShotType>('full_body');
  const [extraStyleTags, setExtraStyleTags] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);

  // LoRA URLs (for testing)
  const [groomLoraUrl, setGroomLoraUrl] = useState('');
  const [brideLoraUrl, setBrideLoraUrl] = useState('');

  // Prompt overrides
  const [promptOverrides, setPromptOverrides] = useState<PromptOverrides>({});

  // Node overrides
  const [nodeOverrides, setNodeOverrides] = useState<NodeOverrides>({
    ...DEFAULT_NODE_SETTINGS,
  });

  // Quality issues
  const [selectedIssues, setSelectedIssues] = useState<QualityIssueId[]>([]);

  // Prompt test hook
  const { isGenerating, error, result, generate } = usePromptTest();

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!selectedTheme || !groomLoraUrl || !brideLoraUrl) {
      return;
    }

    generate({
      themeSlug: selectedTheme.slug as ThemeSlug,
      shotType,
      groomLoraUrl,
      brideLoraUrl,
      promptOverrides,
      nodeOverrides,
      seed,
      extraStyleTags: extraStyleTags || undefined,
    });
  }, [
    selectedTheme,
    shotType,
    groomLoraUrl,
    brideLoraUrl,
    promptOverrides,
    nodeOverrides,
    seed,
    extraStyleTags,
    generate,
  ]);

  // Handle random seed
  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  };

  // Update prompt override helper
  const updatePromptOverride = (key: keyof PromptOverrides, value: string) => {
    setPromptOverrides(prev => ({ ...prev, [key]: value }));
  };

  // Update node override helper
  const updateNodeOverride = (key: keyof NodeOverrides, value: number | string) => {
    setNodeOverrides(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex min-h-screen">
      {/* Main Content (Left 70%) */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Prompt Lab</h1>
          <Badge variant="outline" className="text-xs">
            Desktop Only
          </Badge>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg mb-6">
          <div className="space-y-1">
            <Label className="text-xs">Theme</Label>
            <Select
              value={selectedTheme?.slug || ''}
              onValueChange={(v) => selectTheme(v as ThemeSlug)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.slug} value={theme.slug}>
                    {theme.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Shot Type</Label>
            <Select
              value={shotType}
              onValueChange={(v) => setShotType(v as ShotType)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_body">Full Body</SelectItem>
                <SelectItem value="closeup">Closeup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs">Extra Tags</Label>
            <Input
              value={extraStyleTags}
              onChange={(e) => setExtraStyleTags(e.target.value)}
              placeholder="cinematic lighting, bokeh..."
              className="h-9"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !groomLoraUrl || !brideLoraUrl}
            className="gap-2"
          >
            <SparklesIcon />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {/* LoRA URLs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <Label className="text-xs">Groom LoRA URL</Label>
            <Input
              value={groomLoraUrl}
              onChange={(e) => setGroomLoraUrl(e.target.value)}
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bride LoRA URL</Label>
            <Input
              value={brideLoraUrl}
              onChange={(e) => setBrideLoraUrl(e.target.value)}
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Node Cards */}
        <div className="space-y-4">
          {/* Base Generation */}
          <NodeCard
            title="Base Generation"
            icon={<PaletteIcon />}
            nodeIds="Node 3, 6, 7"
          >
            <NodeCardLeft>
              <PromptInput
                label="Positive Prompt"
                nodeId="Node 6"
                value={promptOverrides.mainPositive || selectedTheme?.mainNegative || ''}
                onChange={(v) => updatePromptOverride('mainPositive', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="140px"
              />
              <PromptInput
                label="Negative Prompt"
                nodeId="Node 7"
                value={promptOverrides.mainNegative || ''}
                onChange={(v) => updatePromptOverride('mainNegative', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="80px"
              />
            </NodeCardLeft>
            <NodeCardRight>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sampler</Label>
                  <Select
                    value={nodeOverrides.samplerName || DEFAULT_NODE_SETTINGS.samplerName}
                    onValueChange={(v) => updateNodeOverride('samplerName', v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Scheduler</Label>
                  <Select
                    value={nodeOverrides.scheduler || DEFAULT_NODE_SETTINGS.scheduler}
                    onValueChange={(v) => updateNodeOverride('scheduler', v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SliderSetting
                label="CFG Scale"
                value={nodeOverrides.cfg ?? DEFAULT_NODE_SETTINGS.cfg}
                onChange={(v) => updateNodeOverride('cfg', v)}
                min={1}
                max={20}
                step={0.5}
              />

              <SliderSetting
                label="Steps"
                value={nodeOverrides.steps ?? DEFAULT_NODE_SETTINGS.steps}
                onChange={(v) => updateNodeOverride('steps', v)}
                min={10}
                max={50}
              />

              <div className="space-y-1">
                <Label className="text-xs">Seed</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={seed ?? ''}
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Random"
                    className="h-8 font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={handleRandomSeed}>
                    <DiceIcon />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={nodeOverrides.width ?? DEFAULT_NODE_SETTINGS.width}
                    onChange={(e) => updateNodeOverride('width', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={nodeOverrides.height ?? DEFAULT_NODE_SETTINGS.height}
                    onChange={(e) => updateNodeOverride('height', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </div>
            </NodeCardRight>
          </NodeCard>

          {/* Groom Face Detailer */}
          <NodeCard
            title="Groom Face Detailer"
            icon={<UserIcon />}
            nodeIds="Node 21, 26, 32"
          >
            <NodeCardLeft>
              <PromptInput
                label="Face Positive"
                nodeId="Node 21"
                value={promptOverrides.groomFacePositive || ''}
                onChange={(v) => updatePromptOverride('groomFacePositive', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="100px"
                warning="No background keywords"
              />
              <PromptInput
                label="Face Negative"
                nodeId="Node 26"
                value={promptOverrides.groomFaceNegative || ''}
                onChange={(v) => updatePromptOverride('groomFaceNegative', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="60px"
              />
            </NodeCardLeft>
            <NodeCardRight>
              <SliderSetting
                label="Denoise"
                value={nodeOverrides.groomDenoise ?? DEFAULT_NODE_SETTINGS.groomDenoise}
                onChange={(v) => updateNodeOverride('groomDenoise', v)}
                min={0.1}
                max={0.9}
                step={0.05}
                isKey
                description="Lower = preserve original | Higher = more change"
              />
              <div className="grid grid-cols-2 gap-3">
                <SliderSetting
                  label="Steps"
                  value={nodeOverrides.groomSteps ?? DEFAULT_NODE_SETTINGS.groomSteps}
                  onChange={(v) => updateNodeOverride('groomSteps', v)}
                  min={5}
                  max={25}
                />
                <SliderSetting
                  label="CFG"
                  value={nodeOverrides.groomCfg ?? DEFAULT_NODE_SETTINGS.groomCfg}
                  onChange={(v) => updateNodeOverride('groomCfg', v)}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
            </NodeCardRight>
          </NodeCard>

          {/* Bride Face Detailer */}
          <NodeCard
            title="Bride Face Detailer"
            icon={<HeartIcon />}
            nodeIds="Node 23, 27, 33"
          >
            <NodeCardLeft>
              <PromptInput
                label="Face Positive"
                nodeId="Node 23"
                value={promptOverrides.brideFacePositive || ''}
                onChange={(v) => updatePromptOverride('brideFacePositive', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="100px"
                warning="No background keywords"
              />
              <PromptInput
                label="Face Negative"
                nodeId="Node 27"
                value={promptOverrides.brideFaceNegative || ''}
                onChange={(v) => updatePromptOverride('brideFaceNegative', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="60px"
              />
            </NodeCardLeft>
            <NodeCardRight>
              <SliderSetting
                label="Denoise"
                value={nodeOverrides.brideDenoise ?? DEFAULT_NODE_SETTINGS.brideDenoise}
                onChange={(v) => updateNodeOverride('brideDenoise', v)}
                min={0.1}
                max={0.9}
                step={0.05}
                isKey
                description="Lower = preserve original | Higher = more change"
              />
              <div className="grid grid-cols-2 gap-3">
                <SliderSetting
                  label="Steps"
                  value={nodeOverrides.brideSteps ?? DEFAULT_NODE_SETTINGS.brideSteps}
                  onChange={(v) => updateNodeOverride('brideSteps', v)}
                  min={5}
                  max={25}
                />
                <SliderSetting
                  label="CFG"
                  value={nodeOverrides.brideCfg ?? DEFAULT_NODE_SETTINGS.brideCfg}
                  onChange={(v) => updateNodeOverride('brideCfg', v)}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
            </NodeCardRight>
          </NodeCard>

          {/* Hand Detailer */}
          <NodeCard
            title="Hand Detailer"
            icon={<HandIcon />}
            nodeIds="Node 38, 39, 37"
          >
            <NodeCardLeft>
              <PromptInput
                label="Hand Positive"
                nodeId="Node 38"
                value={promptOverrides.handPositive || ''}
                onChange={(v) => updatePromptOverride('handPositive', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="80px"
              />
              <PromptInput
                label="Hand Negative"
                nodeId="Node 39"
                value={promptOverrides.handNegative || ''}
                onChange={(v) => updatePromptOverride('handNegative', v)}
                placeholder="Leave empty to use theme default..."
                minHeight="60px"
              />
            </NodeCardLeft>
            <NodeCardRight>
              <SliderSetting
                label="Denoise"
                value={nodeOverrides.handDenoise ?? DEFAULT_NODE_SETTINGS.handDenoise}
                onChange={(v) => updateNodeOverride('handDenoise', v)}
                min={0.1}
                max={0.6}
                step={0.05}
                isKey
              />
              <div className="grid grid-cols-2 gap-3">
                <SliderSetting
                  label="Steps"
                  value={nodeOverrides.handSteps ?? DEFAULT_NODE_SETTINGS.handSteps}
                  onChange={(v) => updateNodeOverride('handSteps', v)}
                  min={5}
                  max={20}
                />
                <SliderSetting
                  label="CFG"
                  value={nodeOverrides.handCfg ?? DEFAULT_NODE_SETTINGS.handCfg}
                  onChange={(v) => updateNodeOverride('handCfg', v)}
                  min={1}
                  max={15}
                />
              </div>
            </NodeCardRight>
          </NodeCard>
        </div>

        {/* Console Output */}
        <div className="mt-6">
          <ConsoleOutput assembledPrompts={result?.assembledPrompts || null} />
        </div>

        {/* Quality Issues Checklist */}
        {result && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium mb-3 block">Quality Issues</Label>
            <div className="flex flex-wrap gap-2">
              {QUALITY_ISSUES.map((issue) => (
                <label
                  key={issue.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIssues.includes(issue.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIssues(prev => [...prev, issue.id]);
                      } else {
                        setSelectedIssues(prev => prev.filter(i => i !== issue.id));
                      }
                    }}
                  />
                  <span className="text-sm">{issue.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel (Right 30%) */}
      <div className="w-[350px] border-l p-6 bg-muted/10">
        <PreviewPanel
          images={result?.images || null}
          isLoading={isGenerating}
          seed={result?.seed || null}
          generationTimeMs={result?.generationTimeMs || null}
          themeSlug={selectedTheme?.slug || null}
        />
      </div>
    </div>
  );
}
