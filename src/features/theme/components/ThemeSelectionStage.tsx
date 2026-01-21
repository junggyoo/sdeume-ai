'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { MagneticButton } from '@/features/upload-v2/components/MagneticButton';
import type { ThemeWithUI } from '../types';

// Fallback images for themes (Unsplash high-quality wedding photos)
const THEME_IMAGES: Record<string, string> = {
  white_studio:
    'https://images.unsplash.com/photo-1546193430-c2d207739ed7?q=80&w=600&fit=crop',
  garden_studio:
    'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=600&fit=crop',
  classic_studio:
    'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=600&fit=crop',
};

interface ThemeSelectionStageProps {
  themes: ThemeWithUI[];
  selectedThemeId: string | null;
  onSelectTheme: (themeId: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isNextDisabled?: boolean;
}

export function ThemeSelectionStage({
  themes,
  selectedThemeId,
  onSelectTheme,
  onNext,
  onBack,
  isLoading = false,
  isNextDisabled = false,
}: ThemeSelectionStageProps) {
  // Use internal state if no external selection provided, default to recommended theme
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  useEffect(() => {
    if (selectedThemeId) {
      setInternalSelected(selectedThemeId);
    } else {
      // Default to AI recommended theme (garden) if available
      const recommendedTheme = themes.find((t) => t.isRecommended);
      if (recommendedTheme) {
        setInternalSelected(recommendedTheme.id);
        onSelectTheme(recommendedTheme.id);
      } else if (themes.length > 0) {
        setInternalSelected(themes[0].id);
        onSelectTheme(themes[0].id);
      }
    }
  }, [selectedThemeId, themes, onSelectTheme]);

  const handleSelect = (themeId: string) => {
    setInternalSelected(themeId);
    onSelectTheme(themeId);
  };

  const selected = selectedThemeId || internalSelected;

  return (
    <div className="w-full flex flex-col items-center px-6 py-12 pb-32">
      {/* Header */}
      <div className="relative w-full text-center mb-12 md:mb-16 space-y-4 max-w-7xl">
        <button
          onClick={onBack}
          className="absolute left-0 top-0 md:hidden text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <button
          onClick={onBack}
          className="absolute left-0 top-2 text-gray-400 hover:text-gray-900 text-sm items-center gap-1 transition-colors hidden md:flex"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h2 className="text-4xl md:text-7xl font-serif font-medium leading-tight tracking-tight">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 animate-pulse pb-2">
            Dreamy Moments
          </span>
          <span className="italic text-gray-400 text-3xl md:text-5xl font-light">
            Capture Your Light
          </span>
        </h2>
        <p className="text-lg md:text-xl text-gray-500 font-light max-w-2xl mx-auto">
          Select a studio atmosphere to begin your session.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-7xl mb-12 md:mb-16">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selected === theme.id}
            onSelect={() => handleSelect(theme.id)}
          />
        ))}
      </div>

      <MagneticButton onClick={onNext} disabled={isNextDisabled || isLoading}>
        {isLoading ? '처리 중...' : '다음 단계로'}
      </MagneticButton>
    </div>
  );
}

interface ThemeCardProps {
  theme: ThemeWithUI;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  // Use thumbnail from API or fallback to Unsplash images
  const imageUrl =
    theme.thumbnailUrl || THEME_IMAGES[theme.slug] || THEME_IMAGES.white_studio;

  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ y: -10 }}
      className={`relative aspect-[3/4] md:aspect-[4/5] rounded-[32px] overflow-hidden cursor-pointer group transition-all duration-300 border-4 
        ${isSelected ? 'border-purple-400 shadow-2xl' : 'border-transparent hover:shadow-xl'}
      `}
    >
      {/* Image */}
      <img
        src={imageUrl}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        alt={theme.name}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* AI Pick */}
      {theme.isRecommended && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#191F28]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 border border-white/10 shadow-lg z-20">
          <Sparkles size={12} className="text-purple-400 fill-purple-400" />{' '}
          AI&apos;s Pick
        </div>
      )}

      {/* Checkmark */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg z-20">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-8 left-8 text-left z-20">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-2 block">
          {theme.ui.nameEn}
        </span>
        <h3 className="text-3xl font-serif text-white mb-2">{theme.name}</h3>

        {/* Details Overlay - Desktop */}
        <div className="hidden md:block overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-20">
          <p className="text-sm text-gray-300 flex items-center gap-2 pt-2">
            {theme.ui.tagline} <ArrowRight size={14} className="text-white" />
          </p>
        </div>

        {/* Mobile fallback for description */}
        <p className="md:hidden text-sm text-gray-300 mt-2">{theme.ui.tagline}</p>
      </div>
    </motion.div>
  );
}
