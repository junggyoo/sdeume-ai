# Technical Requirements Document (TRD): Sdeume AI

| 항목 | 내용 |
| :--- | :--- |
| **Project Name** | Sdeume AI |
| **Version** | **1.1 (Updated)** |
| **Status** | **Approved for Sprint 1** |
| **Document Owner** | Tech Lead |

---

## 1. Executive Technical Summary
- **프로젝트 개요:** Sdeume AI는 웹 기반 버추얼 웨딩 스튜디오로, 사용자가 업로드한 얼굴 사진을 기반으로 LoRA 학습과 이미지 생성 파이프라인을 통해 하이엔드 웨딩 화보를 자동 생성한다. 프론트는 Next.js 기반 단일 웹앱으로 제공하며, 고부하 생성은 Modal(Python)로 분리하고, 학습은 Fal.ai를 사용한다. 데이터 계층은 Supabase(PostgreSQL + Storage + Auth)를 단일 소스로 채택하여 운영 복잡도를 최소화한다.
- **핵심 기술 스택:** Frontend/Backend: Next.js(Node.js), AI Compute: Modal(Python), Training: Fal.ai, DB/Storage/Auth: Supabase, 결제: Toss Payments.
- **주요 기술 목표:**
  - 성능: 단일 이미지 생성 20~40초(A100 기준), LoRA 학습 10~15분 내 완료, 콜드스타트 3초 내.
  - 확장성: 테마/파이프라인 노드 추가 시 코드 변경 최소화(워크플로우 구성 분리).
  - UX 최적화: **Adaptive Polling**을 통한 실시간 "Drop & Blur" 연출, **Design Token** 시스템을 통한 UI 일관성 확보.
- **중요 기술 가정:**
  - Modal의 GPU(A100 80GB)를 안정적으로 할당받을 수 있음.
  - Supabase의 RLS/Storage 서명 URL 기반 보안모델 사용 가능.
  - Fal.ai의 LoRA 학습 결과물 접근이 사전 정의된 URL/토큰으로 가능.

## 2. Tech Stack

| Category | Technology / Library | Reasoning (Why it's chosen for this project) |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | 서버/클라이언트 번들 통합, 이미지 스트리밍 UI, SEO 및 SSR 최적화 |
| **Language (Web)** | TypeScript (Node 20) | 타입 안정성, 대규모 리팩토링 용이 |
| **UI/Styling** | Tailwind CSS, Framer Motion | 빠른 UI 개발, 시네마그래프/리빌 연출, **Design Token** 강제 |
| **State/Data Fetching** | TanStack Query | 요청 캐싱/리트라이, **Adaptive Polling** 구현 용이 |
| **Client ML** | MediaPipe FaceMesh | 클라이언트 측 표정/각도 분석 및 자동 버킷팅 |
| **Image Utils** | browser-image-compression, pica | 업로드 최적화, EXIF 처리, 하이브리드 크롭 |
| **Backend (Web)** | Next.js API Routes | 단일 리포 내 서버 기능 구현(결제/웹훅/큐 제어) |
| **AI Compute** | **Modal (Python 3.10)** | GPU 서버리스, ComfyUI + Impact Pack, **moviepy(영상)** 실행 |
| **Core Model** | Flux.1 Dev (FP8) | 품질/속도 균형, LoRA 호환성 우수 |
| **LoRA Training** | Fal.ai | 빠른 학습 속도 및 안정성 |
| **Database** | Supabase (PostgreSQL 15) | Auth/DB/Storage 일원화, RLS 보안 |
| **Object Storage** | Supabase Storage | 이미지/영상 자산 보관, 서명 URL 배포 |
| **Authentication** | Supabase Auth | 이메일/비밀번호, Google OAuth 통합 |
| **Payment** | Toss Payments | 국내 결제 최적, 웹훅 기반 정산 처리 |
| **Notifications** | **FCM (Firebase) or VAPID** | **(필수)** 학습 완료/촬영 시작 알림 (Web Push) |
| **Monitoring** | Sentry, Modal Logs | 에러/성능 추적, GPU 작업 관찰 |
| **Repo/CI** | TurboRepo, GitHub Actions | 모노레포 구성, Vercel/Modal 배포 파이프라인 |

## 3. System Architecture Design

### 3.1 Top-Level Building Blocks
- **Web App (Next.js):** 프레젠테이션(업로드/테마/다크룸/갤러리), 클라이언트 ML(얼굴 분석), API Routes(결제/작업 요청).
- **AI Compute Service (Modal):**
  - **ComfyUI Pipeline:** Flux.1 Dev + FaceDetailer(Impact Pack).
  - **Video Renderer:** `moviepy` 기반 Viral Movie Maker(Reels 생성).
  - **Optimization:** Memory Snapshot 및 Network Volume 활용.
- **Training Orchestrator (Fal.ai):** LoRA 학습 전담.
- **Data Layer (Supabase):** RLS 적용된 DB, Storage, Auth.

### 3.2 Data Flow & Communication
- **Client-Server:** RESTful API 중심. 상태 확인은 **Adaptive Polling** 사용.
- **Real-time UX Strategy (Adaptive Polling):**
  - Phase 1 (0~15초): 주기 **3초** (초기 부하 방지, Base Generation).
  - Phase 2 (15~40초): 주기 **1초** (생성 완료 임박, "Drop & Blur" 즉시성).
  - Phase 3 (40초~): 주기 **3초** (지연 상황).
- **External Integration:**
  - Fal.ai: 학습 트리거/상태 폴링.
  - Modal: 비동기 작업 실행(Job ID 발급) -> Supabase에 결과 저장.
  - Toss Payments: 웹훅 수신(멱등키 검증) -> Entitlement 갱신.

## 4. Frontend & Design System Integration

디자인 가이드의 시각적 언어를 코드로 정확히 이관하기 위한 기술 명세입니다.

### 4.1 Design Token Configuration (Tailwind)
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          desktop: '#0E1B2A',
          mobile: '#1A2B3C', // Sticky CTA용
          hover: '#14263A',
        },
        secondary: '#F6F1EA',
        accent: {
          rose: '#B9896E',
          teal: '#2E5E5E',
        },
        surface: '#FAF8F5',
        state: { success: '#2E7D66', warning: '#C47F39', error: '#B83A4B' }
      },
      fontFamily: {
        serif: ['var(--font-noto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-pretendard)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'aurora-subtle': 'linear-gradient(180deg, #F6F1EA 0%, #FAF8F5 100%)',
        'aurora-overlay': 'linear-gradient(180deg, rgba(14,27,42,0) 0%, rgba(14,27,42,0.06) 100%)',
        'accent-shine': 'linear-gradient(135deg, #B9896E 0%, rgba(185,137,110,0.9) 100%)',
      },
      animation: {
        'light-sweep': 'lightSweep 0.6s ease-in-out',
        'aurora-float': 'auroraFloat 3s ease-in-out infinite alternate',
      },
      spacing: {
        'safe-bottom': '100px', // Mobile Sticky CTA Safe Area
      }
    },
  },
};
```

### 4.2 Layout & Accessibility
- **Mobile Safe Area:** 글로벌 레이아웃 최하단에 `pb-safe-bottom` (100px)을 적용하여 Sticky CTA가 콘텐츠를 가리지 않도록 강제.
- **Touch Target:** 모바일 뷰포트에서 모든 인터랙티브 요소는 최소 `44x44px` 영역 확보.
- **Motion:** `framer-motion`의 `useReducedMotion` 훅을 사용하여 시스템 설정에 따라 애니메이션(오로라, 라이트 스윕) On/Off 처리.

## 5. Database Schema & Data Models

운영 효율성과 기능 확장을 고려한 스키마 설계입니다.

### 5.1 New & Updated Tables
```sql
-- 1. Themes (테마 관리 및 AI 추천 매핑)
CREATE TABLE themes (
    theme_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- e.g., 'white_minimal'
    display_name_ko VARCHAR(50) NOT NULL,
    description_ko TEXT,
    -- Config: 렌더링 및 파이프라인 설정
    config JSONB NOT NULL DEFAULT '{}', 
    -- { "bgm_url": "...", "sample_urls": [...], "prompt_trigger": "...", "transitions": "fade_in" }
    recommendation_tags TEXT[], -- ['smile', 'bright', 'clean']
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- 2. Images (워터마크 및 환불 심사 데이터 추가)
ALTER TABLE images ADD COLUMN has_watermark BOOLEAN DEFAULT true;
ALTER TABLE images ADD COLUMN face_similarity_score FLOAT; -- 0.0 ~ 1.0 (자동 환불 심사용)
ALTER TABLE images ADD COLUMN blur_url TEXT; -- 생성 직후 노출할 블러 썸네일 URL

-- 3. Retouches (리터치 요청 관리)
CREATE TABLE retouches (
    retouch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id UUID REFERENCES images(image_id),
    user_id UUID REFERENCES users(user_id),
    request_type VARCHAR(20) NOT NULL, -- 'skin', 'body', 'background'
    prompt_override TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    result_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Core Tables Summary
- **users/profiles:** Auth 및 마케팅 수신 동의.
- **uploads:** 원본 및 크롭된 이미지 URL, MediaPipe 분석 메타데이터.
- **lora_models:** Fal.ai 학습 결과물 URL 매핑.
- **generations:** 작업(Job) 단위 상태 관리, 사용된 프롬프트/파라미터.
- **plans/entitlements:** 티어별 권한(남은 장수, 리롤 횟수) 및 유효기간.
- **payments:** 결제 내역 및 Toss `paymentKey`.

## 6. Core Feature Specifications (Implementation Details)

### 6.1 Real-time UX: "Drop & Blur"
- **Placeholders:** 생성 요청 즉시 클라이언트는 '가짜(Dummy) 카드'를 갤러리에 추가. (`status: loading`, 이미지: 테마별 기본 블러 썸네일).
- **Reveal:** Adaptive Polling으로 실제 이미지 URL 수신 시, `AnimatePresence`를 통해 `blur(20px) -> blur(0px)`로 전환하며 이미지를 교체.

### 6.2 Viral Movie Maker (Modal Pipeline)
- **Tech:** Modal 위에서 Python `moviepy` 라이브러리 실행.
- **Trigger:** 베스트 컷 5~7장 ID 전송.
- **Flow:**
  1.  **Asset Load:** Supabase에서 이미지 및 테마별 BGM(`themes.config.bgm_url`) 다운로드.
  2.  **Composition:**
      - Resolution: 1080x1920 (9:16).
      - Effect: Ken Burns (Zoom 1.0 -> 1.15) + Light Leak Overlay.
      - Transition: Cross Dissolve (0.5s).
  3.  **Encoding:** H.264 .mp4 렌더링 후 Storage 업로드.

### 6.3 AI Curation Logic (Client-Side)
- **Input:** Step 1에서 분석한 `avg_smile_score`, `pose_yaw_variance`.
- **Logic Example:**
  - `IF avg_smile_score > 0.7` → Recommend **[B] 가든 스튜디오**.
  - `IF pose_yaw_variance < 0.2` (정면 위주) → Recommend **[C] 클래식 스튜디오**.
  - `ELSE` → Recommend **[A] 화이트 스튜디오**.
- **UI:** 추천 테마에 뱃지 노출 및 정렬 우선순위 부여.

### 6.4 Watermark & Security Policy
- **Free Tier:** 파이프라인 마지막 노드에서 'Sdeume' 로고 합성 강제. 원본(Clean) 이미지는 생성하지 않거나 접근 불가 버킷에 저장.
- **Paid Tier:** 결제 완료 유저에게는 워터마크 노드를 우회한 Clean 이미지 제공.
- **Refund Logic:** `face_similarity_score`가 기준 미달(예: 0.4)인 이미지가 전체의 70% 이상일 때 환불 버튼 활성화 (Phase 3 자동화 예정, MVP는 수동 심사 참고용).

### 6.5 Web Push Notification (Essential)
- **Tech:** Firebase Cloud Messaging (FCM).
- **Timing:**
  1.  **학습 완료:** "작가님이 얼굴을 다 익혔어요! 촬영을 시작합니다." (클릭 -> 라이브 다크룸)
  2.  **촬영 완료:** "화보가 도착했습니다. 봉투를 열어보세요." (클릭 -> 언박싱)

## 7. Performance & Optimization Strategy
- **GPU Optimization:**
  - Modal `enable_memory_snapshot=True` 적용 (콜드스타트 1~3초).
  - Flux.1 체크포인트 및 공용 LoRA를 Network Volume에 사전 적재.
- **Client Performance:**
  - 이미지 업로드 시 클라이언트 사이드 리사이즈(2048px) 및 WebP 압축.
  - 갤러리 뷰에서 `IntersectionObserver` 기반 Lazy Loading.
- **Network:** Adaptive Polling 적용으로 불필요한 API 호출 최소화 및 체감 반응 속도 극대화.

## 8. Implementation Roadmap

### Phase 1: Foundation (MVP) - 4~6 weeks
- **Infrastructure:** 모노레포, Supabase/Modal/Fal.ai 연동.
- **Features:**
  - 업로드(Auto-Sorting), 테마 3종(DB 기반).
  - Modal 생성 파이프라인(워터마크 포함).
  - **Adaptive Polling** 기반 다크룸 UX.
  - **Web Push (필수)** 알림 구현.
  - 결제(Basic/Pro), 갤러리 다운로드.
- **Goal:** 핵심 사이클(업로드~결과)의 완결성 및 안정성 확보.

### Phase 2: Feature Enhancement - 4 weeks
- **Features:**
  - Viral Movie Maker (`moviepy` 파이프라인).
  - 리터치(Inpainting) 요청 UI 및 백엔드.
  - Pro/Max 티어 및 환불 심사 데이터(`similarity_score`) 적재 시작.
- **Ops:** 관리자 대시보드(오퍼레이터 툴), Sentry 전면 도입.

### Phase 3: Scaling & Automation - 4~6 weeks
- **Features:** 다중 GPU 큐(유료 우선), 환불 자동화 심사 룰 적용.
- **Ops:** 데이터 파기 자동화, 엣지 캐시 최적화.

## 9. Risk Assessment & Mitigation
- **GPU Cold Start/Cost:** 메모리 스냅샷 활용 및 유휴 시간 타임아웃 조절.
- **Face Similarity Issue:** Step 1 가이드 강화(O/X 퀴즈) 및 `similarity_score` 모니터링을 통한 모델 튜닝.
- **Video Generation Load:** 영상 합성은 CPU/GPU 부하가 크므로, 이미지 생성 큐와 분리된 별도 Modal 함수(`@app.function(cpu=4.0)`)로 격리 실행.
- **User Drop-off:** 학습 대기(10분) 중 이탈 방지를 위해 Web Push 필수 적용 및 "앱을 닫아도 됩니다" 메시지 강조.

---

## 10. Development Conventions

### Code Structure
- **Frontend (FSD-lite):** `features/[domain]` 폴더 구조 준수. (e.g., `features/upload`, `features/gallery`).
- **Backend (API):** Next.js Route Handlers는 Controller 역할만 수행. 비즈니스 로직은 `packages/domain` 또는 Service 레이어로 분리.

### Commit & Branching
- **Commit Message:** Conventional Commits 준수 (`feat:`, `fix:`, `chore:`).
- **Branch:** `main` (Production), `develop` (Staging), `feature/*` (Development).

### Testing
- **E2E:** Playwright를 사용하여 핵심 유저 플로우(업로드 -> 결제 -> 생성 확인) 검증.
- **Unit:** Jest/Vitest로 유틸리티 함수(가격 계산, 데이터 파싱) 검증.