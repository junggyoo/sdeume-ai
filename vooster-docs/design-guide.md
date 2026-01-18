# Sdeume AI (SdmAI) Design Guide

## 1. Overall Mood (전체적인 무드)
- Concept: **"The Atelier of Dreams"** - 꿈의 아뜰리에
- Brand Tone: 시적(Poetic), 영롱한(Ethereal), 미니멀리즘, 고급스러운 절제미
- Visual Language: 밝고 깨끗한 배경 위 파스텔/오로라 빛 텍스처가 부유하는 느낌
- Design Mood:
  - 배경: 순백(#FAFAFA) 기반의 깔끔한 캔버스
  - 오로라 효과: 자연스럽게 흐르는 파스텔 톤의 빛 (purple/blue/pink)
  - 타이포그래피: Serif(Playfair Display)로 고급스러움, Sans(Inter)로 명료함
- UX Target: 초보자 중심. 한 화면 하나의 목표 + 하나의 주요 버튼. 자동화/기본값 우선, 불안감 최소화.
- Slogan: "꿈꾸던 순간을, 가장 꿈처럼."

## 2. Reference Service (참조 서비스)
- Name: High-End Fashion Editorial
  - Description: 하이엔드 패션 에디토리얼 화보
  - Design Mood: 미니멀한 순백 배경, 드라마틱한 타이포그래피, 영롱한 빛 연출
  - Primary Color: #1A1A1A (Deep Black for Text)
  - Secondary Color: #FAFAFA (Pure White Background)
- Name: Dreamy Aurora Aesthetic
  - Description: 몽환적 오로라/파스텔 빛 효과
  - Design Mood: 부드럽게 흐르는 파스텔 컬러, 대형 블러 처리된 빛 원형
  - Accent Colors: Purple (#C7B9FF), Blue (#86E3FF), Pink (#FFB6C1)

## 3. Color & Gradient (색상 & 그라데이션)
- Mood: 순백 베이스 + 파스텔 오로라 액센트. 전체적으로 밝고 깨끗하며 영롱한 느낌.
- Primary
  - Background: #FAFAFA (순백)
  - Text Primary: #1A1A1A (다크 그레이)
  - Text Secondary: #6B7280 (그레이)
- Secondary
  - Surface: #FFFFFF
  - Border: #E5E7EB
- Accent (Aurora Palette)
  - Purple Light: rgba(192, 132, 252, 0.2) - purple-200/20
  - Blue Light: rgba(147, 197, 253, 0.2) - blue-200/20
  - Pink Light: rgba(251, 207, 232, 0.3) - pink-100/30
  - Purple Gradient: from-purple-600 to-blue-600 (텍스트 그라데이션용)
- CTA Colors
  - Primary Button: #000000 (Black)
  - Primary Button Hover: #1F1F1F
  - Primary Button Text: #FFFFFF
  - Secondary Button: transparent with border
- Semantic
  - Success: #2E7D66
  - Warning: #C47F39
  - Error: #B83A4B
  - Info: #7C3AED (Purple-600)
- Grayscale
  - gray-900: #111827 (Headings)
  - gray-600: #4B5563 (Body Text Light)
  - gray-500: #6B7280 (Captions)
  - gray-400: #9CA3AF (Muted Text)
  - gray-200: #E5E7EB (Borders)
  - gray-100: #F3F4F6 (Light Background)
  - gray-50: #F9FAFB (Subtle Background)
- Gradients
  - Aurora Background 1: bg-purple-200/20 blur-[120px]
  - Aurora Background 2: bg-blue-200/20 blur-[120px]
  - Aurora Background 3: bg-pink-100/30 blur-[100px]
  - Gradient to White: from-[#FAFAFA] via-[#FAFAFA]/60 to-transparent
  - Text Gradient: from-purple-600 to-blue-600
- States
  - Hover Scale: scale(1.05)
  - Button Hover: bg-gray-800
  - Selection: bg-purple-200 text-black

## 4. Typography & Font (타이포그래피 & 폰트)
- Strategy: "Serif for Poetic Soul, Sans for Clean Service"
- Families
  - Headings: Playfair Display (영문 강조), Noto Serif KR (한글 제목), Georgia, serif
  - Body/UI: Inter (영문), Pretendard (한글), sans-serif
- Type Scale (Mobile / Desktop)
  - Hero Display: 48px / 144px (9rem) - Giant headlines, leading-tight
  - H1: 48px / 72px - font-serif font-bold
  - H2: 40px / 64px - font-serif (일반 또는 italic 혼용)
  - H3: 24px / 32px - font-serif
  - Subtitle: 14px / 16px - tracking-[0.5em] uppercase font-light
  - Body L: 18px / 20px - font-light leading-relaxed
  - Body S: 14px / 16px - font-light
  - Caption: 12px / 14px - tracking-widest uppercase
  - Button: 18px / 24px - tracking-wider font-serif
- Letter/Paragraph
  - Letter-spacing Hero Subtitle: 0.5em (tracking-[0.5em])
  - Letter-spacing Caption: 0.2em (tracking-widest)
  - Paragraph spacing: 본문 문단 간 24–32px
- Special Typography Styles
  - Italic Accent: 감성적 문구에 `italic font-light` 적용
  - Gradient Text: `text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600`
- Usage
  - Hero/Section Headers: Serif (Playfair Display for English, Noto Serif KR for Korean)
  - Body/Labels/Buttons: Sans (Inter/Pretendard)
  - 감성 카피: Serif Italic
  - 서브타이틀/캡션: Sans uppercase with wide letter-spacing

## 5. Layout & Structure (레이아웃 & 구조)
- Grid
  - Desktop: max-w-7xl (1280px), Padding 20-24px
  - Tablet: max-w-4xl (896px), Padding 16-20px
  - Mobile: Full-width with 16-24px padding
- Spacing Scale
  - Section Padding: py-32 (128px) ~ py-40 (160px)
  - Content Gap: gap-16 (64px) ~ gap-24 (96px)
  - Element Gap: gap-6 (24px) ~ gap-8 (32px)
- Radius
  - Cards: rounded-sm (미니멀)
  - Buttons: rounded-full (둥근 CTA)
  - Images: rounded-sm
- Shadows
  - shadow-lg: 이미지/카드에 깊이감 부여
  - shadow-2xl shadow-gray-200: 밝은 배경에서의 은은한 그림자
  - shadow-xl: CTA 버튼 강조
- Page Archetypes (5-Act Structure)
  - Act 1 (Intro/Hero): 전체 화면 중앙 정렬, 오로라 배경 + Giant Typography
  - Act 2 (Value): 좌우 교차 그리드 레이아웃 (텍스트 + 이미지)
  - Act 3 (Process): 중앙 정렬 타임라인/스텝 표시
  - Act 4 (Atelier/Theme): 가로 스크롤 카드 갤러리
  - Act 5 (CTA/Finale): 배경 이미지 + 오버레이 + 중앙 CTA
- Aurora Background Layout
  - 여러 개의 큰 원형 블러 요소를 absolute 배치
  - z-index로 콘텐츠 뒤에 배치 (pointer-events-none)
  - 애니메이션으로 천천히 이동하며 생동감 부여

## 6. Visual Style (비주얼 스타일)
- Icons: Lucide React 아이콘 사용, 2px stroke, 기본 컬러 gray-900 또는 gray-400
- Particle Background
  - Canvas 기반 부유하는 미세 파티클 효과
  - 60개 정도의 작은 원형 파티클
  - 낮은 속도로 천천히 이동 (vx/vy: 0.2)
  - 투명도 0.1~0.6으로 은은하게
  - z-0, fixed, pointer-events-none
- Imagery
  - 이미지 프레임: rounded-sm (미니멀)
  - Shadow: shadow-2xl shadow-gray-200
  - Hover Effect: hover:scale-105 transition-transform duration-700
  - Grayscale Effect: grayscale hover:grayscale-0 transition-all duration-1000
  - 이미지 비율: aspect-[3/4] 또는 aspect-square
- Aurora Background Effect
  - 3개의 대형 블러 원형 (w-[70%] h-[70%])
  - blur-[100px] ~ blur-[120px]
  - opacity 20~30%
  - 애니메이션: x/y 좌표 이동 + scale 변화
  - 소요시간: 15~20초 infinite ease-in-out
- Motion & Animation
  - Page Load: opacity 0→1, y 50→0, duration 1~1.5s ease-out
  - Scroll Reveal: whileInView, viewport once, margin "-20%"
  - Float Animation: translateY 0 → -20px → 0, 6s ease-in-out infinite
  - Pulse Slow: 4s cubic-bezier(0.4, 0, 0.6, 1) infinite
  - Scale on Hover: scale 1→1.05 또는 1→1.1, duration 700ms
  - Image Transition: transition-transform duration-[1.5s]
- Button Shine Effect
  - Absolute positioned gradient overlay
  - transform -skew-x-12
  - animate-shine on hover
- Scroll Indicator
  - animate-bounce
  - MousePointer2 아이콘 rotate-180

## 7. UX Guide (UX 가이드)
- Principles (초보자 중심)
  - 한 화면 하나의 목표 + 하나의 Primary CTA
  - 시적이고 감성적인 카피로 서비스의 가치 전달
  - 스크롤 기반 스토리텔링 (5-Act Structure)
- Landing Page Flow (5-Act Structure)
  1) Act 1 - Intro (Hero):
     - 풀스크린 오로라 배경 + Giant Typography
     - "꿈꾸던 순간을, 가장 꿈처럼."
     - 서브타이틀: "The Atelier of Dreams" (tracking-[0.5em])
     - Scroll indicator (animate-bounce)
  2) Act 2 - Value (Philosophy):
     - 좌우 교차 레이아웃
     - 감성 카피: "우리는 촬영이 아닌 자유를 발명했다."
     - 텍스트 그라데이션으로 핵심 문구 강조
     - 이미지: hover시 scale-up 효과
  3) Act 3 - Process (3 Second Magic):
     - 타임라인 형태의 3단계 프로세스
     - 단계명: 영감(Inspiration) → 공명(Resonance) → 개화(Bloom)
     - 대형 단계 번호 (01, 02, 03) 워터마크 스타일
  4) Act 4 - Atelier (Theme Selection):
     - 가로 스크롤 테마 카드 갤러리
     - 테마: White Poem, Garden Whisper, Midnight Waltz, Retro Cinema
     - 호버시 이미지 scale-up, 텍스트 애니메이션
  5) Act 5 - Finale (CTA):
     - 배경 이미지 + 그라데이션 오버레이
     - "믿기지 않나요?" 질문형 카피
     - 풀 라운드 CTA 버튼 (shine 효과)
- Microcopy Style
  - 시적이고 영롱한 언어 사용
  - 짧은 문장, 줄바꿈 활용
  - 영문 서브타이틀과 한글 메인 카피 조합
- Interaction Patterns
  - Scroll-triggered animations (whileInView)
  - 카드 호버시 콘텐츠 트랜지션
  - 가로 스크롤 스냅 (snap-center)
  - CTA 버튼 shine 효과

## 8. UI Component Guide (UI 컴포넌트 가이드)
- Buttons
  - Primary CTA (Hero):
    - BG: #000000 (black)
    - Text: #FFFFFF, font-serif text-xl md:text-2xl tracking-wider
    - Padding: px-16 py-6
    - Radius: rounded-full
    - Hover: bg-gray-800, scale(1.05)
    - Active: scale(0.95)
    - Shadow: shadow-xl
    - Shine Effect: absolute gradient overlay with animate-shine
  - Secondary (Glass Button):
    - BG: transparent with white/10 background
    - Border: 1px solid white/10
    - Hover: bg-white/10 transition
- Theme Cards (Atelier)
  - Size: w-[300px] md:w-[400px], h-[500px] md:h-[600px]
  - Image: overflow-hidden, hover:scale-110 duration-[1.5s]
  - Hover Effect: bg-white/10 overlay 트랜지션
  - Text: font-serif, 호버시 text-purple-600 트랜지션
  - Subtitle: uppercase tracking-widest text-gray-400
- Image Cards (Value Section)
  - Aspect Ratio: aspect-[3/4] 또는 aspect-square
  - Border: rounded-sm
  - Shadow: shadow-2xl shadow-gray-200
  - Image Effects:
    - hover:scale-105 transition-transform duration-700
    - grayscale hover:grayscale-0 transition-all duration-1000
- Process Steps (Timeline)
  - Step Number: 대형 (text-6xl) gray-100 색상, 워터마크 스타일
  - Title: text-2xl font-serif gray-900
  - Description: font-light gray-500
  - Layout: vertical timeline with border-l
- Navigation
  - Minimal: 랜딩페이지에서는 네비게이션 최소화
  - Scroll Indicator: absolute bottom-12, animate-bounce
- Footer
  - BG: #FAFAFA (일관된 배경)
  - Text: gray-400, uppercase tracking-widest text-xs
  - Content: 저작권 + 슬로건 ("Invented Freedom")

부록 A. Design Tokens (요약)
- colors.background: #FAFAFA
- colors.text.primary: #1A1A1A (gray-900)
- colors.text.secondary: #6B7280 (gray-500)
- colors.text.muted: #9CA3AF (gray-400)
- colors.aurora.purple: rgba(192, 132, 252, 0.2)
- colors.aurora.blue: rgba(147, 197, 253, 0.2)
- colors.aurora.pink: rgba(251, 207, 232, 0.3)
- colors.cta.primary: #000000
- colors.cta.hover: #1F2937
- font.serif: Playfair Display, Noto Serif KR, Georgia, serif
- font.sans: Inter, Pretendard, sans-serif

부록 B. Tailwind Config Snippet
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Noto Serif KR', 'Georgia', 'serif'],
        sans: ['Inter', 'Pretendard', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shine': 'shine 1s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        }
      }
    }
  }
}
```

부록 C. Aurora Background Implementation
```tsx
// Aurora Background Effect
<div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
  <motion.div
    animate={{
      x: ['-20%', '20%', '-20%'],
      y: ['-20%', '20%', '-20%'],
      scale: [1, 1.2, 1],
    }}
    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-200/20 blur-[120px]"
  />
  <motion.div
    animate={{
      x: ['20%', '-20%', '20%'],
      y: ['20%', '-20%', '20%'],
      scale: [1.2, 1, 1.2],
    }}
    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-200/20 blur-[120px]"
  />
  <motion.div
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    className="absolute top-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-100/30 blur-[100px]"
  />
</div>
```

부록 D. Key Copy/Messaging
- Hero Subtitle: "The Atelier of Dreams"
- Hero Main: "꿈꾸던 순간을, 가장 꿈처럼."
- Value 1: "우리는 촬영이 아닌 자유를 발명했다."
- Value 2: "완벽한 빛을 소유하는 방법"
- Process Title: "당신의 일상이 예술이 되는 3초의 마법"
- Steps: 영감(Inspiration), 공명(Resonance), 개화(Bloom)
- CTA: "믿기지 않나요?" → "스튜디오 입장하기"
- Footer: "Invented Freedom"

---