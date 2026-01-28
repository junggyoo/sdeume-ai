import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// =============================================================================
// Heavy dependency mocks (prevent OOM in test environment)
// =============================================================================

vi.mock('framer-motion', () => {
  const React = require('react');
  function makeMotion(tag: string) {
    return React.forwardRef(function MotionMock(props: Record<string, unknown>, ref: unknown) {
      const {
        initial: _i, animate: _a, exit: _e, transition: _t,
        whileHover: _wh, whileTap: _wt, variants: _v, layout: _l,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref });
    });
  }
  return {
    motion: {
      div: makeMotion('div'),
      span: makeMotion('span'),
      img: makeMotion('img'),
      aside: makeMotion('aside'),
      button: makeMotion('button'),
      p: makeMotion('p'),
      section: makeMotion('section'),
    },
    AnimatePresence: ({ children }: { children: unknown }) => children,
  };
});

vi.mock('lucide-react', () => {
  const React = require('react');
  const icon = (name: string) =>
    React.forwardRef(function MockIcon(props: Record<string, unknown>, ref: unknown) {
      return React.createElement('svg', { ...props, ref, 'data-testid': `icon-${name}` });
    });
  return {
    Settings: icon('Settings'), Layers: icon('Layers'), Lock: icon('Lock'),
    Unlock: icon('Unlock'), Zap: icon('Zap'), Copy: icon('Copy'),
    Eye: icon('Eye'), Code: icon('Code'), Star: icon('Star'),
    Save: icon('Save'), History: icon('History'), ExternalLink: icon('ExternalLink'),
    Loader2: icon('Loader2'), Wand2: icon('Wand2'), X: icon('X'),
    User: icon('User'), Hand: icon('Hand'), Palette: icon('Palette'),
    Maximize2: icon('Maximize2'), Sparkles: icon('Sparkles'), Heart: icon('Heart'),
    Check: icon('Check'), Terminal: icon('Terminal'), ChevronDown: icon('ChevronDown'),
    Link2: icon('Link2'),
  };
});

import PromptLabPage from '../page';

// =============================================================================
// Mocks
// =============================================================================

const mockThemes = [
  {
    slug: 'white_studio',
    nameKo: '화이트 스튜디오',
    nameEn: 'White Studio',
    description: 'Minimal studio',
    mainPositive: {
      camera: 'front-facing portrait',
      composition: 'wide angle',
      background: 'white studio',
      atmosphere: 'elegant',
      lighting: 'soft lighting',
      groomStyle: 'black tuxedo',
      brideStyle: 'white dress',
      quality: '8k resolution',
    },
    mainNegative: 'blurry, low quality',
    groomFacePositive: 'detailed face',
    groomFaceNegative: 'woman',
    brideFacePositive: 'bridal makeup',
    brideFaceNegative: 'man',
    handPositive: 'detailed hands',
    handNegative: '',
    defaultSettings: { cfg: 1, steps: 25, width: 896, height: 1152 },
  },
  {
    slug: 'garden_studio',
    nameKo: '가든 스튜디오',
    nameEn: 'Garden Studio',
    description: 'Garden setting',
    mainPositive: {
      camera: 'garden portrait',
      composition: 'natural',
      background: 'garden',
      atmosphere: 'romantic',
      lighting: 'natural light',
      groomStyle: 'suit',
      brideStyle: 'flowing dress',
      quality: '8k',
    },
    mainNegative: 'cartoon',
    groomFacePositive: 'natural face',
    groomFaceNegative: 'female',
    brideFacePositive: 'soft makeup',
    brideFaceNegative: 'male',
    handPositive: 'hands',
    handNegative: '',
    defaultSettings: { cfg: 1, steps: 25, width: 896, height: 1152 },
  },
];

const mockGenerateResult = {
  testId: 'test-123',
  images: [{ base64: 'abc123', contentType: 'image/png', width: 896, height: 1152 }],
  assembledPrompts: {
    node6MainPositive: 'test prompt',
    node7MainNegative: 'negative',
    node21GroomFace: 'groom face',
    node26GroomFaceNegative: 'neg',
    node23BrideFace: 'bride face',
    node27BrideFaceNegative: 'neg',
    node38HandPositive: 'hands',
    node39HandNegative: '',
  },
  generationTimeMs: 45000,
  seed: 12345,
};

const mockHistoryTests = [
  {
    id: 'hist-1',
    userId: 'user-1',
    themeSlug: 'white_studio',
    shotType: 'full_body',
    seed: 11111,
    generationTimeMs: 40000,
    images: [{ base64: 'img1', contentType: 'image/png', width: 896, height: 1152 }],
    assembledPrompts: mockGenerateResult.assembledPrompts,
    qualityIssues: null,
    notes: null,
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z',
    promptOverrides: null,
    nodeOverrides: null,
    extraStyleTags: null,
    groomLoraUrl: null,
    brideLoraUrl: null,
  },
];

// Mock hooks
vi.mock('@/features/admin-prompt-lab/hooks/useThemeConfig', () => ({
  useThemeConfig: vi.fn(() => ({
    themes: mockThemes,
    selectedTheme: mockThemes[0],
    isLoading: false,
    error: null,
    fetchThemes: vi.fn(),
    selectTheme: vi.fn(),
  })),
}));

vi.mock('@/features/admin-prompt-lab/hooks/usePromptTest', () => ({
  usePromptTest: vi.fn(() => ({
    isGenerating: false,
    error: null,
    result: null,
    generate: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('@/features/admin-prompt-lab/hooks/useConsoleLog', () => ({
  useConsoleLog: vi.fn(() => ({
    logs: [],
    elapsedTime: 0,
    scrollRef: { current: null },
    addLog: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    clearLogs: vi.fn(),
    getLogsByPhase: vi.fn(() => []),
  })),
}));

vi.mock('@/features/admin-prompt-lab/hooks/useTestHistory', () => ({
  useTestHistory: vi.fn(() => ({
    tests: mockHistoryTests,
    total: 1,
    hasMore: false,
    isLoading: false,
    error: null,
    query: { limit: 20, offset: 0 },
    setQuery: vi.fn(),
    fetchHistory: vi.fn(),
    loadMore: vi.fn(),
    updateTest: vi.fn(),
    deleteTest: vi.fn(),
    getTestById: vi.fn(),
  })),
}));

// =============================================================================
// Tests
// =============================================================================

describe('PromptLabPage - New UI Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('3-Column Layout Structure', () => {
    it('should render left sidebar with Workflow Config', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Workflow Config')).toBeInTheDocument();
      expect(screen.getByText('Theme Preset')).toBeInTheDocument();
      expect(screen.getByText('Global Geometry')).toBeInTheDocument();
      expect(screen.getByText('Seed Control')).toBeInTheDocument();
    });

    it('should not render External Assets section in sidebar (moved to pipeline)', () => {
      render(<PromptLabPage />);

      expect(screen.queryByText('External Assets')).not.toBeInTheDocument();
    });

    it('should render center Pipeline Editor area with LoRA NodeCards', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Pipeline Editor')).toBeInTheDocument();
      expect(screen.getByText('Base Generation')).toBeInTheDocument();
      expect(screen.getByText('Groom LoRA')).toBeInTheDocument();
      expect(screen.getByText('Bride LoRA')).toBeInTheDocument();
      expect(screen.getByText('Groom Face Detailer')).toBeInTheDocument();
      expect(screen.getByText('Bride Face Detailer')).toBeInTheDocument();
      expect(screen.getByText('Hand Detailer')).toBeInTheDocument();
    });

    it('should render right sidebar with Output Analyzer', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Output Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Model Fidelity Score')).toBeInTheDocument();
      expect(screen.getByText('Artifact Observations')).toBeInTheDocument();
      expect(screen.getByText('Technical Notes')).toBeInTheDocument();
      expect(screen.getByText('Test History')).toBeInTheDocument();
    });
  });

  describe('Left Sidebar - Workflow Config', () => {
    it('should display theme selector with loaded themes', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Theme Preset')).toBeInTheDocument();
    });

    it('should display global geometry inputs (width/height)', () => {
      render(<PromptLabPage />);

      expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    });

    it('should display LoRA URL inputs in pipeline editor (not sidebar)', () => {
      render(<PromptLabPage />);

      expect(screen.getByLabelText(/groom lora url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bride lora url/i)).toBeInTheDocument();
    });

    it('should display Generate Test button', () => {
      render(<PromptLabPage />);

      expect(screen.getByRole('button', { name: /generate test/i })).toBeInTheDocument();
    });

    it('should display Image Count slider', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Image Count')).toBeInTheDocument();
    });
  });

  describe('Center - Pipeline Editor NodeCards', () => {
    it('should display positive and negative prompt textareas for Base Generation', () => {
      render(<PromptLabPage />);

      const positiveLabels = screen.getAllByText('Positive');
      const negativeLabels = screen.getAllByText('Negative');

      expect(positiveLabels.length).toBeGreaterThanOrEqual(1);
      expect(negativeLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should display sampler and scheduler selects in Base Generation', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Sampler')).toBeInTheDocument();
      expect(screen.getByText('Scheduler')).toBeInTheDocument();
    });

    it('should display denoise slider for face detailers', () => {
      render(<PromptLabPage />);

      const denoiseLabels = screen.getAllByText('Denoise');
      expect(denoiseLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should support Dashboard and Raw JSON view modes', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Raw JSON')).toBeInTheDocument();
    });
  });

  describe('Right Sidebar - Output Analyzer', () => {
    it('should display preview area', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Output Analyzer')).toBeInTheDocument();
    });

    it('should display star rating for model fidelity', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Model Fidelity Score')).toBeInTheDocument();
    });

    it('should display artifact observation chips', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Artifact Observations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /broken hands/i })).toBeInTheDocument();
    });

    it('should display test history list', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Test History')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow toggling seed between random and fixed', async () => {
      const user = userEvent.setup();
      render(<PromptLabPage />);

      const randomButton = screen.getByRole('button', { name: /random/i });
      expect(randomButton).toBeInTheDocument();

      await user.click(randomButton);
    });

    it('should allow editing prompt text', async () => {
      const user = userEvent.setup();
      render(<PromptLabPage />);

      const textareas = screen.getAllByPlaceholderText(/prompt|constraints/i);
      expect(textareas.length).toBeGreaterThan(0);

      const promptTextarea = textareas[0] as HTMLTextAreaElement;
      await user.click(promptTextarea);
      await user.type(promptTextarea, ' custom prompt text');

      expect(promptTextarea.value).toContain('custom prompt text');
    });

    it('should allow selecting artifact observation chips', async () => {
      const user = userEvent.setup();
      render(<PromptLabPage />);

      const brokenHandsChip = screen.getByRole('button', { name: /broken hands/i });
      await user.click(brokenHandsChip);

      expect(brokenHandsChip).toHaveClass(/bg-red|border-red/);
    });
  });

  describe('Generation Flow', () => {
    it('should enable generate button when LoRA URLs have default values', () => {
      render(<PromptLabPage />);

      const generateButton = screen.getByRole('button', { name: /generate test/i });
      expect(generateButton).not.toBeDisabled();
    });

    it('should show loading state during generation', async () => {
      const { usePromptTest } = await import('@/features/admin-prompt-lab/hooks/usePromptTest');
      vi.mocked(usePromptTest).mockReturnValue({
        isGenerating: true,
        error: null,
        result: null,
        generate: vi.fn(),
        reset: vi.fn(),
      });

      render(<PromptLabPage />);

      const loadingElements = screen.getAllByText(/generating|running/i);
      expect(loadingElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display generated image after successful generation', async () => {
      const { usePromptTest } = await import('@/features/admin-prompt-lab/hooks/usePromptTest');
      vi.mocked(usePromptTest).mockReturnValue({
        isGenerating: false,
        error: null,
        result: mockGenerateResult,
        generate: vi.fn(),
        reset: vi.fn(),
      });

      render(<PromptLabPage />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when generation fails', async () => {
      const { usePromptTest } = await import('@/features/admin-prompt-lab/hooks/usePromptTest');
      vi.mocked(usePromptTest).mockReturnValue({
        isGenerating: false,
        error: 'Generation failed: timeout',
        result: null,
        generate: vi.fn(),
        reset: vi.fn(),
      });

      render(<PromptLabPage />);

      expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
    });
  });

  describe('LoRA NodeCards in Pipeline Editor', () => {
    it('should render Groom LoRA NodeCard with URL input and trigger badge', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Groom LoRA')).toBeInTheDocument();
      expect(screen.getByText('Node 14')).toBeInTheDocument();
      expect(screen.getByText('GROOM_SDME')).toBeInTheDocument();
      expect(screen.getByLabelText(/groom lora url/i)).toBeInTheDocument();
    });

    it('should render Bride LoRA NodeCard with URL input and trigger badge', () => {
      render(<PromptLabPage />);

      expect(screen.getByText('Bride LoRA')).toBeInTheDocument();
      expect(screen.getByText('Node 15')).toBeInTheDocument();
      expect(screen.getByText('BRIDE_SDME')).toBeInTheDocument();
      expect(screen.getByLabelText(/bride lora url/i)).toBeInTheDocument();
    });

    it('should render LoRA strength sliders with default value of 1', () => {
      render(<PromptLabPage />);

      const strengthLabels = screen.getAllByText('Strength');
      expect(strengthLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow editing Groom LoRA URL', () => {
      render(<PromptLabPage />);

      const groomInput = screen.getByLabelText(/groom lora url/i) as HTMLInputElement;
      fireEvent.change(groomInput, { target: { value: 'https://example.com/groom.safetensors' } });

      expect(groomInput.value).toBe('https://example.com/groom.safetensors');
    });

    it('should allow editing Bride LoRA URL', () => {
      render(<PromptLabPage />);

      const brideInput = screen.getByLabelText(/bride lora url/i) as HTMLInputElement;
      fireEvent.change(brideInput, { target: { value: 'https://example.com/bride.safetensors' } });

      expect(brideInput.value).toBe('https://example.com/bride.safetensors');
    });

    it('should allow adjusting LoRA strength via slider', () => {
      render(<PromptLabPage />);

      const strengthSliders = screen.getAllByRole('slider');
      const loraStrengthSliders = strengthSliders.filter((slider) => {
        const el = slider as HTMLInputElement;
        return el.min === '0' && el.max === '2' && el.step === '0.05';
      });

      expect(loraStrengthSliders.length).toBeGreaterThanOrEqual(2);
      expect((loraStrengthSliders[0] as HTMLInputElement).value).toBe('1');
    });

    it('should place LoRA NodeCards between Base Generation and Groom Face Detailer', () => {
      render(<PromptLabPage />);

      const allNodeTitles = screen.getAllByText(
        /Base Generation|Groom LoRA|Bride LoRA|Groom Face Detailer|Bride Face Detailer|Hand Detailer/
      );

      const titleTexts = allNodeTitles.map((el) => el.textContent);
      const baseIdx = titleTexts.indexOf('Base Generation');
      const groomLoraIdx = titleTexts.indexOf('Groom LoRA');
      const brideLoraIdx = titleTexts.indexOf('Bride LoRA');
      const groomFaceIdx = titleTexts.indexOf('Groom Face Detailer');

      expect(baseIdx).toBeLessThan(groomLoraIdx);
      expect(groomLoraIdx).toBeLessThan(brideLoraIdx);
      expect(brideLoraIdx).toBeLessThan(groomFaceIdx);
    });
  });

  describe('Dark Theme Styling', () => {
    it('should apply dark background to main container', () => {
      render(<PromptLabPage />);

      const container = screen.getByTestId('prompt-lab-container');
      expect(container).toHaveClass('bg-zinc-950');
    });
  });
});
