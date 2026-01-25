'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Layers,
  Lock,
  Unlock,
  Zap,
  Copy,
  Eye,
  Code,
  Star,
  Save,
  History,
  ExternalLink,
  Loader2,
  Wand2,
  X,
  User,
  Hand,
  Palette,
  Maximize2,
  Sparkles,
  Heart,
  Check,
  Terminal,
  ChevronDown,
} from 'lucide-react';

import { usePromptTest } from '@/features/admin-prompt-lab/hooks/usePromptTest';
import { useThemeConfig } from '@/features/admin-prompt-lab/hooks/useThemeConfig';
import { useTestHistory } from '@/features/admin-prompt-lab/hooks/useTestHistory';
import {
  DEFAULT_NODE_SETTINGS,
  SAMPLER_OPTIONS,
  SCHEDULER_OPTIONS,
  QUALITY_ISSUES,
  formatMainPositivePrompt,
} from '@/features/admin-prompt-lab/types';
import type {
  PromptOverrides,
  NodeOverrides,
  QualityIssueId,
} from '@/features/admin-prompt-lab/types';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

interface PipelineStage {
  id: 'base' | 'groom' | 'bride' | 'hand';
  title: string;
  icon: React.ElementType;
  positiveKey: keyof PromptOverrides;
  negativeKey: keyof PromptOverrides;
  nodeIds: string;
}

// =============================================================================
// Constants
// =============================================================================

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'base',
    title: 'Base Generation',
    icon: Palette,
    positiveKey: 'mainPositive',
    negativeKey: 'mainNegative',
    nodeIds: 'Node 3, 6, 7',
  },
  {
    id: 'groom',
    title: 'Groom Face Detailer',
    icon: User,
    positiveKey: 'groomFacePositive',
    negativeKey: 'groomFaceNegative',
    nodeIds: 'Node 21, 26, 32',
  },
  {
    id: 'bride',
    title: 'Bride Face Detailer',
    icon: Heart,
    positiveKey: 'brideFacePositive',
    negativeKey: 'brideFaceNegative',
    nodeIds: 'Node 23, 27, 33',
  },
  {
    id: 'hand',
    title: 'Hand Detailer',
    icon: Hand,
    positiveKey: 'handPositive',
    negativeKey: 'handNegative',
    nodeIds: 'Node 38, 39, 37',
  },
];

const ARTIFACT_CHIPS = [
  { id: 'finger_broken', label: 'Broken Hands' },
  { id: 'face_distorted', label: 'Distorted Face' },
  { id: 'lighting_off', label: 'Bad Lighting' },
  { id: 'background_leak', label: 'Artifacts' },
  { id: 'skin_plastic', label: 'Lost Likeness' },
] as const;

// =============================================================================
// Sub-Components
// =============================================================================

interface NodeCardProps {
  stage: PipelineStage;
  positiveValue: string;
  negativeValue: string;
  onPositiveChange: (value: string) => void;
  onNegativeChange: (value: string) => void;
  settingsContent: React.ReactNode;
}

const NodeCard: React.FC<NodeCardProps> = ({
  stage,
  positiveValue,
  negativeValue,
  onPositiveChange,
  onNegativeChange,
  settingsContent,
}) => {
  const Icon = stage.icon;
  const tokenCount = (positiveValue?.length || 0) + (negativeValue?.length || 0);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-zinc-500" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">
            {stage.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-zinc-600">{stage.nodeIds}</span>
          <button className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col lg:flex-row min-h-[180px]">
        {/* Left: Prompts */}
        <div className="flex-1 p-3 space-y-3 border-r border-zinc-800/50">
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Positive
              </label>
              <span className="text-[9px] font-mono text-zinc-700">
                Tokens: {Math.floor(tokenCount / 4)}
              </span>
            </div>
            <textarea
              value={positiveValue}
              onChange={(e) => onPositiveChange(e.target.value)}
              className="w-full h-20 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed text-zinc-300 placeholder:text-zinc-700"
              placeholder="Positive prompt data..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
              Negative
            </label>
            <textarea
              value={negativeValue}
              onChange={(e) => onNegativeChange(e.target.value)}
              className="w-full h-14 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-red-900/30 resize-none leading-relaxed text-zinc-600 placeholder:text-zinc-800"
              placeholder="Negative constraints..."
            />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="w-full lg:w-[240px] bg-zinc-900/60 p-3 space-y-4">
          {settingsContent}
        </div>
      </div>
    </div>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  accentColor?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  accentColor = 'purple',
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-mono">
      <span className="text-zinc-500">{label}</span>
      <span className={`text-${accentColor}-400`}>{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1 bg-zinc-800 accent-${accentColor}-500 rounded-full appearance-none cursor-pointer`}
      style={{ accentColor: accentColor === 'purple' ? '#a855f7' : '#3b82f6' }}
    />
  </div>
);

// =============================================================================
// Main Page Component
// =============================================================================

export default function PromptLabPage() {
  // === Hooks ===
  const { themes, selectedTheme, selectTheme } = useThemeConfig();
  const { isGenerating, error, result, generate } = usePromptTest();
  const { tests: historyTests, updateTest } = useTestHistory({ autoFetch: true });

  // === State ===
  const [shotType, setShotType] = useState<ShotType>('full_body');
  const [extraStyleTags, setExtraStyleTags] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [isFixedSeed, setIsFixedSeed] = useState(false);
  const [groomLoraUrl, setGroomLoraUrl] = useState('');
  const [brideLoraUrl, setBrideLoraUrl] = useState('');
  const [promptOverrides, setPromptOverrides] = useState<PromptOverrides>({});
  const [nodeOverrides, setNodeOverrides] = useState<NodeOverrides>({
    ...DEFAULT_NODE_SETTINGS,
  });
  const [activeIssues, setActiveIssues] = useState<QualityIssueId[]>([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'json'>('dashboard');
  const [copied, setCopied] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);

  // === Derived State ===
  const themePrompts = useMemo(() => {
    if (!selectedTheme) return null;
    return {
      mainPositive: formatMainPositivePrompt(selectedTheme.mainPositive),
      mainNegative: selectedTheme.mainNegative,
      groomFacePositive: selectedTheme.groomFacePositive,
      groomFaceNegative: selectedTheme.groomFaceNegative,
      brideFacePositive: selectedTheme.brideFacePositive,
      brideFaceNegative: selectedTheme.brideFaceNegative,
      handPositive: selectedTheme.handPositive,
      handNegative: selectedTheme.handNegative,
    };
  }, [selectedTheme]);

  // === Effects ===
  useEffect(() => {
    if (selectedTheme?.defaultSettings) {
      setNodeOverrides((prev) => ({
        ...prev,
        cfg: selectedTheme.defaultSettings.cfg,
        steps: selectedTheme.defaultSettings.steps,
        width: selectedTheme.defaultSettings.width,
        height: selectedTheme.defaultSettings.height,
      }));
    }
  }, [selectedTheme]);

  // === Handlers ===
  const handleGenerate = useCallback(() => {
    if (!selectedTheme || !groomLoraUrl || !brideLoraUrl) return;

    generate({
      themeSlug: selectedTheme.slug as ThemeSlug,
      shotType,
      groomLoraUrl,
      brideLoraUrl,
      promptOverrides,
      nodeOverrides,
      seed: isFixedSeed ? seed : undefined,
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
    isFixedSeed,
    extraStyleTags,
    generate,
  ]);

  const toggleSeedLock = () => {
    if (!isFixedSeed) {
      setSeed(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    }
    setIsFixedSeed(!isFixedSeed);
  };

  const updatePromptOverride = (key: keyof PromptOverrides, value: string) => {
    setPromptOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const updateNodeOverride = (key: keyof NodeOverrides, value: number | string) => {
    setNodeOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const toggleIssue = (issueId: QualityIssueId) => {
    setActiveIssues((prev) =>
      prev.includes(issueId) ? prev.filter((i) => i !== issueId) : [...prev, issueId]
    );
  };

  const handleCopyPrompt = async () => {
    if (!result?.assembledPrompts) return;
    const text = Object.entries(result.assembledPrompts)
      .map(([key, value]) => `[${key}]: ${value}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommitToDatabase = async () => {
    if (!result?.testId) return;
    try {
      await updateTest(result.testId, {
        qualityIssues: activeIssues,
        notes: notes || undefined,
      });
    } catch (err) {
      console.error('Failed to commit:', err);
    }
  };

  const getPromptValue = (key: keyof PromptOverrides): string => {
    return promptOverrides[key] ?? (themePrompts?.[key as keyof typeof themePrompts] as string) ?? '';
  };

  // === Render ===
  return (
    <div
      data-testid="prompt-lab-container"
      className="fixed inset-0 z-[60] bg-zinc-950 text-zinc-300 flex overflow-hidden font-sans text-sm select-none"
    >
      {/* === COLUMN 1: WORKFLOW CONFIG (260px) === */}
      <aside className="w-[260px] border-r border-zinc-800 flex flex-col bg-zinc-900 shadow-xl z-20">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-bold">
            <Settings size={16} className="text-purple-400" />
            <span className="tracking-tighter">Workflow Config</span>
          </div>
          <button className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-zinc-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Theme Preset */}
          <div className="space-y-2">
            <label
              id="theme-preset-label"
              className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest"
            >
              Theme Preset
            </label>
            <select
              aria-labelledby="theme-preset-label"
              value={selectedTheme?.slug || ''}
              onChange={(e) => selectTheme(e.target.value as ThemeSlug)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500/50 transition-colors text-zinc-300"
            >
              {themes.map((theme) => (
                <option key={theme.slug} value={theme.slug}>
                  {theme.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Shot Type */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              Shot Type
            </label>
            <select
              value={shotType}
              onChange={(e) => setShotType(e.target.value as ShotType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500/50 transition-colors text-zinc-300"
            >
              <option value="full_body">Full Body</option>
              <option value="closeup">Closeup</option>
            </select>
          </div>

          {/* Global Geometry */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              Global Geometry
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="width-input" className="text-[10px] text-zinc-600">Width</label>
                <input
                  id="width-input"
                  type="number"
                  value={nodeOverrides.width ?? DEFAULT_NODE_SETTINGS.width}
                  onChange={(e) => updateNodeOverride('width', Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="height-input" className="text-[10px] text-zinc-600">Height</label>
                <input
                  id="height-input"
                  type="number"
                  value={nodeOverrides.height ?? DEFAULT_NODE_SETTINGS.height}
                  onChange={(e) => updateNodeOverride('height', Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Seed Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                Seed Control
              </label>
              <button
                onClick={toggleSeedLock}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  isFixedSeed
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
                aria-label={isFixedSeed ? 'Locked seed' : 'Random seed'}
              >
                {isFixedSeed ? <Lock size={10} /> : <Unlock size={10} />}
                {isFixedSeed ? 'LOCKED' : 'RANDOM'}
              </button>
            </div>
            <input
              disabled={!isFixedSeed}
              type="text"
              value={isFixedSeed ? seed : '-1'}
              onChange={(e) => setSeed(Number(e.target.value))}
              placeholder={isFixedSeed ? 'Enter seed' : '-1'}
              className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none font-mono transition-opacity ${
                !isFixedSeed && 'opacity-20 pointer-events-none'
              }`}
            />
          </div>

          {/* External Assets */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Layers size={12} /> External Assets
            </label>
            <div className="space-y-2">
              <div className="space-y-1">
                <label htmlFor="groom-lora" className="text-[9px] text-zinc-600 px-1">Groom LoRA</label>
                <input
                  id="groom-lora"
                  type="text"
                  value={groomLoraUrl}
                  onChange={(e) => setGroomLoraUrl(e.target.value)}
                  placeholder="path/to/groom_lora.safetensors"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-mono outline-none text-zinc-300 placeholder:text-zinc-700"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="bride-lora" className="text-[9px] text-zinc-600 px-1">Bride LoRA</label>
                <input
                  id="bride-lora"
                  type="text"
                  value={brideLoraUrl}
                  onChange={(e) => setBrideLoraUrl(e.target.value)}
                  placeholder="path/to/bride_lora.safetensors"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-mono outline-none text-zinc-300 placeholder:text-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            disabled={isGenerating || !groomLoraUrl || !brideLoraUrl}
            onClick={handleGenerate}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 transition-all active:scale-[0.98] group"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
            )}
            <span>{isGenerating ? 'GENERATING...' : 'GENERATE TEST'}</span>
          </button>
        </div>
      </aside>

      {/* === COLUMN 2: PIPELINE EDITOR (Flexible) === */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
        {/* Header Toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-zinc-200 font-bold flex items-center gap-2">
              <Zap size={16} className="text-purple-500" /> Pipeline Editor
            </h2>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-2 transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Eye size={12} /> Dashboard
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-2 transition-colors ${
                  viewMode === 'json'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Code size={12} /> Raw JSON
              </button>
            </div>
          </div>
          <button
            onClick={handleCopyPrompt}
            disabled={!result?.assembledPrompts}
            className="flex items-center gap-2 text-zinc-500 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="text-[10px] uppercase font-bold tracking-widest">
              {copied ? 'Copied!' : 'Copy Compiled Prompt'}
            </span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Pipeline Cards */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Base Generation */}
            <NodeCard
              stage={PIPELINE_STAGES[0]}
              positiveValue={getPromptValue('mainPositive')}
              negativeValue={getPromptValue('mainNegative')}
              onPositiveChange={(v) => updatePromptOverride('mainPositive', v)}
              onNegativeChange={(v) => updatePromptOverride('mainNegative', v)}
              settingsContent={
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Sampler</label>
                      <select
                        value={nodeOverrides.samplerName || DEFAULT_NODE_SETTINGS.samplerName}
                        onChange={(e) => updateNodeOverride('samplerName', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[10px] outline-none text-zinc-300"
                      >
                        {SAMPLER_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Scheduler</label>
                      <select
                        value={nodeOverrides.scheduler || DEFAULT_NODE_SETTINGS.scheduler}
                        onChange={(e) => updateNodeOverride('scheduler', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[10px] outline-none text-zinc-300"
                      >
                        {SCHEDULER_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <SliderControl
                    label="Steps"
                    value={nodeOverrides.steps ?? DEFAULT_NODE_SETTINGS.steps}
                    onChange={(v) => updateNodeOverride('steps', v)}
                    min={10}
                    max={50}
                  />
                  <SliderControl
                    label="CFG Scale"
                    value={nodeOverrides.cfg ?? DEFAULT_NODE_SETTINGS.cfg}
                    onChange={(v) => updateNodeOverride('cfg', v)}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                </>
              }
            />

            {/* Groom Face Detailer */}
            <NodeCard
              stage={PIPELINE_STAGES[1]}
              positiveValue={getPromptValue('groomFacePositive')}
              negativeValue={getPromptValue('groomFaceNegative')}
              onPositiveChange={(v) => updatePromptOverride('groomFacePositive', v)}
              onNegativeChange={(v) => updatePromptOverride('groomFaceNegative', v)}
              settingsContent={
                <>
                  <SliderControl
                    label="Denoise"
                    value={nodeOverrides.groomDenoise ?? DEFAULT_NODE_SETTINGS.groomDenoise}
                    onChange={(v) => updateNodeOverride('groomDenoise', v)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                  />
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Guide Size</label>
                    <input
                      type="number"
                      value={nodeOverrides.groomGuideSize ?? DEFAULT_NODE_SETTINGS.groomGuideSize}
                      onChange={(e) => updateNodeOverride('groomGuideSize', Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] outline-none text-zinc-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Model</label>
                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[10px] outline-none text-zinc-300">
                      <option value="bbox">face_yolov8m.pt</option>
                      <option value="segm">face_segm.pt</option>
                    </select>
                  </div>
                </>
              }
            />

            {/* Bride Face Detailer */}
            <NodeCard
              stage={PIPELINE_STAGES[2]}
              positiveValue={getPromptValue('brideFacePositive')}
              negativeValue={getPromptValue('brideFaceNegative')}
              onPositiveChange={(v) => updatePromptOverride('brideFacePositive', v)}
              onNegativeChange={(v) => updatePromptOverride('brideFaceNegative', v)}
              settingsContent={
                <>
                  <SliderControl
                    label="Denoise"
                    value={nodeOverrides.brideDenoise ?? DEFAULT_NODE_SETTINGS.brideDenoise}
                    onChange={(v) => updateNodeOverride('brideDenoise', v)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                  />
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Guide Size</label>
                    <input
                      type="number"
                      value={nodeOverrides.brideGuideSize ?? DEFAULT_NODE_SETTINGS.brideGuideSize}
                      onChange={(e) => updateNodeOverride('brideGuideSize', Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[10px] outline-none text-zinc-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Model</label>
                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[10px] outline-none text-zinc-300">
                      <option value="bbox">face_yolov8m.pt</option>
                      <option value="segm">face_segm.pt</option>
                    </select>
                  </div>
                </>
              }
            />

            {/* Hand Detailer */}
            <NodeCard
              stage={PIPELINE_STAGES[3]}
              positiveValue={getPromptValue('handPositive')}
              negativeValue={getPromptValue('handNegative')}
              onPositiveChange={(v) => updatePromptOverride('handPositive', v)}
              onNegativeChange={(v) => updatePromptOverride('handNegative', v)}
              settingsContent={
                <>
                  <SliderControl
                    label="Denoise"
                    value={nodeOverrides.handDenoise ?? DEFAULT_NODE_SETTINGS.handDenoise}
                    onChange={(v) => updateNodeOverride('handDenoise', v)}
                    min={0.1}
                    max={0.6}
                    step={0.05}
                  />
                  <SliderControl
                    label="Confidence"
                    value={nodeOverrides.handThreshold ?? DEFAULT_NODE_SETTINGS.handThreshold}
                    onChange={(v) => updateNodeOverride('handThreshold', v)}
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    accentColor="blue"
                  />
                </>
              }
            />
          </div>
        </div>

        {/* Console Output / Terminal */}
        <div className="border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
            className="w-full px-6 py-2 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <Terminal size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Console Output</span>
              {result?.assembledPrompts && (
                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                  {Object.keys(result.assembledPrompts).length} nodes
                </span>
              )}
            </div>
            <ChevronDown
              size={14}
              className={`text-zinc-600 transition-transform ${isConsoleExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {isConsoleExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="max-h-[200px] overflow-y-auto px-6 pb-4 scrollbar-thin">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs space-y-2">
                    {result?.assembledPrompts ? (
                      Object.entries(result.assembledPrompts).map(([nodeKey, prompt]) => (
                        <div key={nodeKey} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 text-[10px]">[{nodeKey}]</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(prompt)}
                              className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                              aria-label={`Copy ${nodeKey}`}
                            >
                              <Copy size={10} />
                            </button>
                          </div>
                          <p className="text-zinc-500 leading-relaxed pl-2 border-l border-zinc-800 text-[11px]">
                            {prompt || <span className="text-zinc-700 italic">empty</span>}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-700 text-center py-4">
                        <p className="text-[10px] uppercase tracking-widest">Waiting for generation...</p>
                        <p className="text-[9px] mt-1 text-zinc-800">
                          Compiled prompts will appear here after running a test
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* === COLUMN 3: OUTPUT ANALYZER (380px) === */}
      <aside className="w-[380px] border-l border-zinc-800 flex flex-col bg-zinc-900">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-bold">
            <Sparkles size={16} className="text-blue-400" />
            <span>Output Analyzer</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">
              {result?.generationTimeMs
                ? `Lat: ${(result.generationTimeMs / 1000).toFixed(1)}s`
                : 'Lat: --'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Preview Image */}
          <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group ring-1 ring-white/5">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-20"
                >
                  <Loader2 size={32} className="animate-spin text-purple-500 mb-4" />
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-500 animate-pulse">
                    Running Tensors...
                  </span>
                </motion.div>
              ) : result?.images?.[0] ? (
                <motion.img
                  key={result.seed}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={`data:${result.images[0].contentType};base64,${result.images[0].base64}`}
                  alt="Generated result"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs">
                  No preview
                </div>
              )}
            </AnimatePresence>
            {result?.images?.[0] && (
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-black transition-colors border border-white/10">
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Model Fidelity Score */}
          <section className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
              Model Fidelity Score
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`transition-all ${
                    rating >= s ? 'text-yellow-500 scale-110' : 'text-zinc-800 hover:text-zinc-700'
                  }`}
                >
                  <Star size={20} fill={rating >= s ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </section>

          {/* Artifact Observations */}
          <section className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
              Artifact Observations
            </label>
            <div className="flex flex-wrap gap-2">
              {ARTIFACT_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => toggleIssue(chip.id as QualityIssueId)}
                  aria-label={chip.label}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    activeIssues.includes(chip.id as QualityIssueId)
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'border-zinc-800 bg-zinc-800/50 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </section>

          {/* Technical Notes */}
          <section className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
              Technical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Log observation data..."
              className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/30 font-mono placeholder:text-zinc-700"
            />
            <button
              onClick={handleCommitToDatabase}
              disabled={!result?.testId}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-all shadow-sm"
            >
              <Save size={14} /> COMMIT TO DATABASE
            </button>
          </section>

          <div className="h-[1px] bg-zinc-800 w-full" />

          {/* Test History */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest flex items-center gap-2">
                <History size={12} /> Test History
              </label>
              <button className="text-[9px] text-zinc-600 hover:text-zinc-400 font-bold tracking-widest uppercase transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {historyTests.slice(0, 5).map((test) => (
                <div
                  key={test.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-800">
                    {test.images?.[0] && (
                      <img
                        src={`data:${test.images[0].contentType};base64,${test.images[0].base64}`}
                        alt=""
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold text-zinc-400 truncate">
                      TEST_{test.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      {test.themeSlug} • {test.shotType}
                    </p>
                  </div>
                  {test.isFavorite && (
                    <div className="flex items-center gap-1 text-yellow-600/80 font-bold text-[10px]">
                      <Star size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
              ))}
              {historyTests.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No history yet</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
