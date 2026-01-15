"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetBody,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";

interface Theme {
  id: string;
  name: string;
  description: string;
  color: string;
  samples: string[];
}

const themes: Theme[] = [
  {
    id: "white",
    name: "화이트 스튜디오",
    description: "깔끔하고 미니멀한 자연광 스튜디오",
    color: "bg-white",
    samples: [
      "화이트 샘플 1",
      "화이트 샘플 2",
      "화이트 샘플 3",
      "화이트 샘플 4",
      "화이트 샘플 5",
      "화이트 샘플 6",
      "화이트 샘플 7",
      "화이트 샘플 8",
    ],
  },
  {
    id: "garden",
    name: "가든 스튜디오",
    description: "초록 정원과 따뜻한 햇살의 자연 무드",
    color: "bg-green-100",
    samples: [
      "가든 샘플 1",
      "가든 샘플 2",
      "가든 샘플 3",
      "가든 샘플 4",
      "가든 샘플 5",
      "가든 샘플 6",
      "가든 샘플 7",
      "가든 샘플 8",
    ],
  },
  {
    id: "classic",
    name: "클래식 스튜디오",
    description: "웅장하고 고급스러운 호텔 예식 무드",
    color: "bg-amber-50",
    samples: [
      "클래식 샘플 1",
      "클래식 샘플 2",
      "클래식 샘플 3",
      "클래식 샘플 4",
      "클래식 샘플 5",
      "클래식 샘플 6",
      "클래식 샘플 7",
      "클래식 샘플 8",
    ],
  },
];

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* 테마 카드 */}
      <button
        onClick={onSelect}
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-[12px] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-desktop)] focus-visible:ring-offset-2",
          isSelected
            ? "ring-2 ring-[var(--color-primary-desktop)]"
            : "ring-1 ring-[var(--color-line)] hover:ring-[var(--color-sub)]"
        )}
      >
        {/* 플레이스홀더 배경 (실제로는 비디오가 들어갈 자리) */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            theme.color
          )}
        >
          <div className="flex flex-col items-center gap-2 text-[var(--color-sub)]">
            <svg
              className="h-12 w-12 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
            <span className="text-sm">모션 썸네일</span>
          </div>
        </div>

        {/* 선택 체크 */}
        {isSelected && (
          <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-rose)]">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
      </button>

      {/* 테마 정보 */}
      <div className="mt-3 flex items-start justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            {theme.name}
          </h3>
          <p className="text-sm text-[var(--color-body)]">{theme.description}</p>
        </div>

        {/* 자세히 보기 버튼 */}
        <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
          <BottomSheetTrigger asChild>
            <button
              className="shrink-0 text-sm font-medium text-[var(--color-accent-rose)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-rose)] focus-visible:ring-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              자세히 보기
            </button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>{theme.name}</BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody>
              <p className="mb-4 text-sm text-[var(--color-body)]">
                {theme.description}
              </p>
              {/* 샘플 이미지 그리드 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {theme.samples.map((sample, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex aspect-[4/5] items-center justify-center rounded-[8px]",
                      theme.color,
                      "border border-[var(--color-line)]"
                    )}
                  >
                    <span className="text-xs text-[var(--color-sub)]">
                      {sample}
                    </span>
                  </div>
                ))}
              </div>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      </div>
    </div>
  );
}

export function ThemePreviewSection() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  return (
    <section
      className="bg-[var(--color-surface)] py-16 md:py-24"
      aria-labelledby="theme-heading"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="mb-12 text-center">
          <h2
            id="theme-heading"
            className="mb-4 font-serif text-3xl font-bold text-[var(--color-ink)] md:text-4xl"
          >
            테마를 선택하세요
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[var(--color-body)]">
            3가지 스튜디오 테마 중 원하는 분위기를 선택하세요
          </p>
        </div>

        {/* 테마 카드 그리드 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onSelect={() => setSelectedTheme(theme.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
