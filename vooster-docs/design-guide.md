# Sdeume AI (SdmAI) Design Guide

## 1. Overall Mood (전체적인 무드)
- Concept: Trustworthy Professionalism + Mobile Comfort + Dreamy Aurora
- Brand Tone: 신뢰, 품격, 절제, 차분함, 친근한 배려
- Visual Ratio: Artifact Uprising 70%(브랜드의 뼈대·타이포 중심·갤러리 무드) + Arc Browser 30%(오로라/빛 텍스처·모션 포인트)
- UX Target: 초보자 중심. 한 화면 하나의 목표 + 하나의 주요 버튼. 자동화/기본값 우선, 불안감 최소화.
- PRD Alignment:
  - Step 1~2: 업로드 O/X 가이드, 자동 버킷 분류, Smart Mix 전처리
  - Step 3: 인터랙티브 쇼룸(모션 썸네일, 얼굴 버블 오버레이)
  - Step 4: 2-Phase(학습/생성) 대기 경험 + 푸시 알림
  - Step 5: 왁스 실링 언박싱, Viral Movie Maker, 티어별 Re-roll

## 2. Reference Service (참조 서비스)
- Name: Artifact Uprising
  - Description: 프리미엄 사진 인화/앨범 제작
  - Design Mood: 뉴트럴 톤, 타이포 중심, 절제된 컬러와 여백
  - Primary Color: #2E2E2E
  - Secondary Color: #EEE6DD
- Name: Arc Browser (Marketing)
  - Description: 모던 브라우저 브랜딩/웹
  - Design Mood: 딥 네이비 베이스 + 오로라/빛의 질감, 미래적 모션
  - Primary Color: #0A1F44
  - Secondary Color: #7A5AF8

## 3. Color & Gradient (색상 & 그라데이션)
- Mood: 쿨 베이스(네이비) + 웜 액센트(아이보리·로즈골드). 전체 채도 Low~Mid, 액센트 Mid.
- Primary
  - Desktop Primary: #0E1B2A
  - Mobile Primary (Sticky CTA): #1A2B3C
- Secondary: Champagne Ivory #F6F1EA
- Accent
  - Rose Gold: #B9896E(가격/추천/진행률)
  - Evergreen Teal: #2E5E5E(완료/긍정 상태)
- Semantic
  - Success: #2E7D66
  - Warning: #C47F39
  - Error: #B83A4B
  - Info: #1F6FEB
- Grayscale
  - Ink(Heading): #111827
  - Body(Text): #374151
  - Sub(Caption): #6B7280
  - Line(Border): #E5E7EB
  - Surface(BG): #FAF8F5
- Gradients
  - Hero Subtle: linear-gradient(180deg, #F6F1EA 0%, #FAF8F5 100%)
  - Aurora Overlay (Waiting): linear-gradient(180deg, rgba(14,27,42,0) 0%, rgba(14,27,42,0.06) 100%)
  - Accent Shine(Chip/Button): linear-gradient(135deg, #B9896E 0%, rgba(185,137,110,0.9) 100%)
  - Aurora Hues(저채도/6–10%): Teal #86E3FF, Lilac #C7B9FF, Warm Glow #FFD6A5
- Color Usage
  - Primary CTA/Headers: #0E1B2A + Text #FFFFFF
  - Mobile Sticky CTA: #1A2B3C(야외 시인성 강화)
  - Background/Surface: #F6F1EA / #FAF8F5(섹션 구분)
  - Highlights/Badges: #B9896E
  - Stepper Done: #2E5E5E
  - Dividers/Lines: #E5E7EB
- States
  - Primary Hover: #14263A, Pressed: #0B1622
  - Disabled: BG #7C8794, Text #E5E7EB
  - Ghost Hover BG: #F1EBE3

## 4. Typography & Font (타이포그래피 & 폰트)
- Strategy: “Serif for Soul, Sans for Service”
- Families
  - Headings: Noto Serif KR, Georgia, serif
  - Body/UI: Pretendard, Inter, sans-serif
- Type Scale (Mobile / Desktop)
  - H1: 40/48, 700 (48/56)
  - H2: 32/40, 700 (40/48)
  - H3: 24/32, 600 (28/36)
  - Subtitle: 18/28, 600
  - Body L: 16/26, 400
  - Body S: 14/22, 400
  - Caption: 12/18, 500
  - Button: 16/100%, 600(대문자 지양)
- Letter/Paragraph
  - Letter-spacing: 기본 0, Caption -0.1px, H1/H2 -0.2px
  - Paragraph spacing: 본문 문단 간 12–16px
- Usage
  - 타이틀/섹션 헤드: Serif
  - 본문/라벨/버튼/테이블: Sans
  - 가격/숫자: Sans Tabular Lining

## 5. Layout & Structure (레이아웃 & 구조)
- Grid
  - Desktop: 12 cols, Max 1040px, Gutter 24px
  - Tablet: 8 cols, Max 720px, Gutter 20px
  - Mobile: 4 cols, Fluid 360–412px, Gutter 16px, Margin 16px
- Spacing Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- Radius
  - Cards/Modals 12px, Buttons/Inputs 10px, Images 8px
- Shadows
  - shadow-sm: 0 6px 16px rgba(14,27,42,0.08)
  - shadow-md: 0 10px 24px rgba(14,27,42,0.12)
- Page Archetypes
  - Hero: 타이포 중심 + Hero Subtle BG + 오로라 텍스처(6–8% 투명, 대비 AA 유지)
  - Form/Checkout: 섹션 스택(모바일 1열), Surface BG로 구분
  - Gallery: 핀터레스트형 Masonry 2–3열(모바일 2열)
  - Stepper: 상단 얇은 바(현재 Deep Navy, 완료 Teal)
- Mobile Safe Area Strategy
  - Sticky CTA Padding: 모바일 뷰포트 하단에 고정된 CTA 버튼이 최하단 콘텐츠를 가리지 않도록, 메인 컨테이너(Main Container)에 padding-bottom: 80px ~ 100px (버튼 높이 + 여유분)을 강제 적용.
  - Scroll Behavior: 스크롤이 끝까지 내려갔을 때 버튼 위로 마지막 콘텐츠가 온전히 보여야 함.

## 6. Visual Style (비주얼 스타일)
- Icons: 2px 라인, 둥근 코너 2px, 기본 컬러 #0E1B2A(상태 컬러 적용)
- Illustration: 업로드 O/X 가이드용 심플 플랫, 네이비/아이보리 저채도
- Imagery
  - 이미지 프레임: Radius 8px, Border #E5E7EB, shadow-sm
  - 워터마크(프리뷰): White 50% + Drop Shadow, Right-Bottom 16px
  - Viral Movie Thumbnail: 정지 이미지와 구분하기 위해 Aurora Gradient가 적용된 Play Icon을 중앙에 배치. 테두리에 은은한 Aurora Glow 효과를 주어 클릭 유도.
- Motion
  - Micro: 180–240ms ease-out
  - Ambient Aurora: 1200–1800ms, 저채도/저광량
  - Reveal: 왁스 실링 → Light Bloom 350–500ms → Gallery Fade
  - Magic Fix (Retouching): 토글 작동 시 이미지 위로 "Light Bloom Sweep" (빛이 왼쪽에서 오른쪽으로 지나가는 효과) 적용. 단순 로딩 스피너보다 '보정 중'이라는 느낌 강조.
- Accessibility
  - 오로라 위 텍스트 시 6–8% 딤 + 대비 4.5:1 이상

## 7. UX Guide (UX 가이드)
- Principles(초보자 중심)
  - 한 화면 하나의 목표 + 하나의 Primary CTA
  - 자동화/기본값 우선, 불안감 최소화(“나중에 바꿀 수 있어요”)
  - 상단 Stepper로 현재 위치 명료, 하단 Sticky CTA로 언제든 진행
- Navigation
  - Header: 좌 로고 / 우 "무료 체험"
  - Stepper(4단계): Upload → Theme → Shooting → Reveal
  - Footer: Sticky CTA 고정
- Step Flows(PRD 준수)
  1) Guidance & Upload
     - 신랑/신부 탭 분리, 3초 O/X 가이드
     - "사진 한 번에 선택(20~30장)" CTA
     - 자동 분류: A 정면(8–10), B 반측면(6–8), C 표정/기타
     - Gap Filling: 부족 각도만 콕 집어 요청
     - Soft Pass: 15장 이상 진행 허용("5장 더하면 퀄리티 UP")
  2) Theme Selection
     - 3개 테마(화이트/가든/클래식) 모션 썸네일
     - 얼굴 버블 롱프레스 → 오버레이(가상 피팅)
     - 바텀 시트 룩북(8종 포즈) + AI 추천 뱃지
     - 스튜디오 스탠바이 로딩 화면: "AI 디렉터가 촬영 스탠바이를 하고 있습니다..."
  3) Shooting (2-Phase)
     - Phase 1(10–15분): Deep Navy + 오로라 앰비언트, "앱 닫아도 괜찮아요", 촬영 시작 알림 기본 ON
     - Phase 2(5분): Drop & Blur → "디테일 보정 중…" 라이트 스윕
     - 상태: 학습 중 → 촬영 준비 → 촬영 중 → 보정 중
  4) Reveal & Share
     - 왁스 실링 언박싱 → Gallery
     - 고화질 다운로드, 티어별 Re-roll(Free 불가, Basic 1회/4장)
     - Viral Movie Maker(15초 Reels/Shorts)
     - Magic Fix(“✨ AI 피부/톤 보정”) 즉시 반영
     - 환불 배너: “안 닮으면 100% 환불(조건 보기)”
- Microcopy
  - 업로드: “완벽해요! 옆모습 3장만 더하면 더 닮게 나와요.”
  - 대기: “작가님이 두 분의 빛을 익히는 중이에요. 잠시만요!”
  - 리빌: “기다림 끝, 두 분의 하이엔드 화보가 도착했어요.”
  - 실패: “얼굴이 가려졌어요. 좋은 예시(O/X)를 참고해 다시 선택해볼까요?”
- Retention/Fail-safe
  - 푸시 알림(학습→촬영), 자동 저장/복귀 안내
  - 환불 경로: 결과 확인 → “사용 가능한 사진 30% 미만” 셀프 체크 → 접수
- Accessibility
  - 텍스트 16px+, 터치 44px+
  - 대비 AA 이상(버튼/경고/오버레이)
  - “움직임 줄이기” 토글 제공

## 8. UI Component Guide (UI 컴포넌트 가이드)
- Buttons
  - Primary: BG #0E1B2A, Text #FFFFFF, Radius 10px, Padding 14/20, Hover #14263A, Disabled BG #7C8794 Text #E5E7EB
  - Mobile Sticky CTA: BG #1A2B3C, Full-width, 상단 분리 그림자(shadow-up)
  - Secondary(Ghost): Border #0E1B2A33, Text #0E1B2A, Hover BG #F1EBE3
- Inputs
  - Height 48px, Radius 10px, Border #E5E7EB, Focus #355876
  - Label 14/600, Help 12 #6B7280, Error #B83A4B
- Cards
  - Theme Card: 16:9, 선택 시 2px #0E1B2A + Rose Gold 체크
  - Upload Card: Dashed Border + 간단 일러스트 가이드
  - Photo Card: 일반 4:5 또는 1:1 비율, Shadow-sm.
  - Movie Maker Card: - 9:16 세로 비율 강조.
     - Visual Cue: 중앙에 Glassmorphism Play Button (Blur 배경 + Aurora Icon) 배치.
     - Hover: 카드 전체 테두리에 Accent Shine 그라데이션 보더(1px) 활성화.
- Navigation
  - Header 64px(좌 로고/우 무료체험), Stepper 상단 얇은 바(현재 Deep Navy, 완료 Teal), Footer Sticky CTA
- Progress/Status
  - Progress Bar: 트랙 #E5E7EB, 진행 Rose Gold
  - Toasts: Success #2E7D66, Warning #C47F39, Error #B83A4B(배경 12% 투명)
- Toggles/Switch
  - Magic Fix: 
      1. Off(Gray) → On(Deep Navy), 토글 시 Rose Gold 스피너 400ms.
      2. Click: 토글 스위치 즉시 Disabled 처리 (중복 클릭 방지).
      3. Processing: 메인 이미지 영역에 Light Bloom Sweep 이펙트 활성화.
      4. Done: 보정된 이미지 교체와 함께 토글 On(Deep Navy) 상태로 전환 및 활성화.
  
- Badges/Chips
  - “AI 추천”, “리롤 1회 남음”: BG rgba(185,137,110,0.12), Text #B9896E
- Modals/Sheets
  - Bottom Sheet: Radius 16px, Drag Handle, 배경 딤 40%
- Loaders
  - Aurora Ambient: 1200–1800ms, 저채도
  - Light Sweep(디테일링): 1회 600ms

부록 A. Design Tokens(요약)
- colors.primary.desktop: #0E1B2A
- colors.primary.mobile: #1A2B3C
- colors.secondary: #F6F1EA
- colors.accent.rose: #B9896E
- colors.accent.teal: #2E5E5E
- colors.surface: #FAF8F5
- colors.state.success: #2E7D66
- colors.state.warning: #C47F39
- colors.state.error: #B83A4B
- font.serif: Noto Serif KR
- font.sans: Pretendard
- radius.card: 12px, radius.input: 10px, radius.image: 8px
- shadow.sm: 0 6px 16px rgba(14,27,42,0.08)

부록 B. Tailwind Config Snippet
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { desktop: '#0E1B2A', mobile: '#1A2B3C' },
        secondary: '#F6F1EA',
        accent: { rose: '#B9896E', teal: '#2E5E5E' },
        surface: '#FAF8F5',
        state: { success: '#2E7D66', warning: '#C47F39', error: '#B83A4B' }
      },
      fontFamily: {
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
        sans: ['Pretendard', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'aurora-subtle': 'linear-gradient(180deg, #F6F1EA 0%, #FAF8F5 100%)',
      },
      borderRadius: { card: '12px', input: '10px', image: '8px' },
      boxShadow: {
        sm: '0 6px 16px rgba(14,27,42,0.08)',
        md: '0 10px 24px rgba(14,27,42,0.12)'
      }
    }
  }
}
```

부록 C. Implementation Notes (PRD 연계)
- Step 4 대기/촬영: 오로라 앰비언트 위 텍스트 대비 확보(딤 6–8%)
- Gallery: “🔄 다시 찍기” 티어 정책 준수(Free 불가, Basic 1회/4장)
- Viral Movie Maker: 테마별 BGM + Light Leak/Dissolve + Ken Burns
- 퍼포먼스: 이미지 로드 지연 시 Blur → Sharpen 전환으로 기대감 유지
- 접근성: 모션 민감도 “움직임 줄이기” 토글, 버튼 최소 44px 터치 영역

---