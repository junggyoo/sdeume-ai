'use client';

import Image from 'next/image';

interface ThemeInfo {
  id: string;
  name: string;
  thumbnailUrl: string | null;
}

interface SelectedThemeCardProps {
  theme: ThemeInfo | null;
  onChangeTheme?: () => void;
}

export function SelectedThemeCard({ theme, onChangeTheme }: SelectedThemeCardProps) {
  if (!theme) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
          {theme.thumbnailUrl ? (
            <Image
              src={theme.thumbnailUrl}
              alt={theme.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400">선택한 컨셉</p>
          <p className="font-medium text-white">{theme.name}</p>
        </div>
      </div>
      {onChangeTheme && (
        <button
          type="button"
          onClick={onChangeTheme}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          변경
        </button>
      )}
    </div>
  );
}
