# Sdeume AI - Project Overview

## 프로젝트 목적
**Sdeume AI (스드메 AI)**는 스튜디오 촬영을 생략하거나 실패한 커플을 위해, 온라인으로 웨딩 화보를 즉시 생성해주는 **AI 기반 버추얼 웨딩 스튜디오**입니다.

### 핵심 가치 제안 (UVP)
- **Stress-Free Wedding Prep:** 스드메 준비의 스트레스를 0으로
- **Sub-Album Solution:** "못 해본 컨셉, AI로 채우는 2% 아쉬움"
- **Active Directing:** 내가 원하는 분위기와 배경을 선택하는 주체적 경험

## 기술 스택

### Frontend/Backend
| 기술 | 용도 |
|------|------|
| **Next.js 16 (App Router)** | 프론트엔드 프레임워크, SSR/SEO 최적화 |
| **TypeScript** | 타입 안정성 |
| **Tailwind CSS v4** | UI 스타일링, Design Token |
| **Framer Motion** | 애니메이션 (시네마그래프, 리빌 연출) |
| **TanStack Query** | 서버 상태 관리, Adaptive Polling |
| **Zustand** | 클라이언트 상태 관리 |
| **Zod** | 스키마 검증 |
| **Hono** | API Routes 내부 라우팅 |

### AI Compute
| 기술 | 용도 |
|------|------|
| **Modal (Python)** | 서버리스 GPU, ComfyUI + Impact Pack |
| **Flux.1 Dev (FP8)** | 이미지 생성 모델 |
| **Fal.ai** | LoRA 학습 |
| **MediaPipe FaceMesh** | 클라이언트 측 얼굴 분석 |

### Infrastructure
| 기술 | 용도 |
|------|------|
| **Supabase** | PostgreSQL DB, Storage, Auth |
| **Vercel** | 프론트엔드 배포 |
| **QStash** | 비동기 작업 큐 |
| **Toss Payments** | 결제 |

### Testing
| 기술 | 용도 |
|------|------|
| **Vitest** | 단위/통합 테스트 |
| **Playwright** | E2E 테스트 |
| **Testing Library** | React 컴포넌트 테스트 |

## 주요 성능 목표
- 단일 이미지 생성: 20~40초 (A100 기준)
- LoRA 학습: 10~15분 내 완료
- GPU 콜드스타트: 3초 내
