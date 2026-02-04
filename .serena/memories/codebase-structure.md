# Codebase Structure

## 프로젝트 루트
```
sdeume-ai/
├── src/                    # 메인 소스 코드
├── modal/                  # Modal (Python) AI 연산 코드
├── supabase/              # Supabase 설정 및 마이그레이션
├── vooster-docs/          # 프로젝트 문서 (PRD, 아키텍처 등)
├── e2e/                   # Playwright E2E 테스트
├── public/                # 정적 파일
├── scripts/               # 유틸리티 스크립트
└── .github/               # GitHub Actions CI/CD
```

## src/ 디렉토리 구조 (FSD-lite)
```
src/
├── app/                   # Next.js App Router 페이지
├── features/              # 도메인별 기능 모듈
│   ├── auth/             # 인증
│   ├── upload/           # 이미지 업로드
│   ├── upload-v2/        # 업로드 v2
│   ├── theme/            # 테마 선택
│   ├── shoot/            # 촬영 대기
│   ├── shooting/         # 촬영 진행
│   ├── reveal/           # 결과 공개
│   ├── generation/       # 이미지 생성
│   ├── project/          # 프로젝트 관리
│   ├── face/             # 얼굴 분석
│   ├── payment/          # 결제
│   ├── dashboard/        # 대시보드
│   ├── dashboard-v2/     # 대시보드 v2
│   ├── admin-prompt-lab/ # 관리자 프롬프트 랩
│   ├── studio/           # 스튜디오
│   └── example/          # 예제
├── components/            # 공통 UI 컴포넌트
│   └── ui/               # shadcn/ui 기반 컴포넌트
├── backend/              # 백엔드 서비스 로직
├── hooks/                # 공통 커스텀 훅
├── lib/                  # 유틸리티, 헬퍼 함수
├── types/                # 글로벌 타입 정의
└── constants/            # 상수 정의
```

## features/ 내부 구조
각 feature 폴더는 다음 구조를 따릅니다:
```
features/[domain]/
├── components/           # 도메인 전용 컴포넌트
├── hooks/               # 도메인 전용 훅
├── api/                 # API 호출 함수
├── types/               # 도메인 전용 타입
├── utils/               # 도메인 전용 유틸리티
└── index.ts             # public exports
```

## modal/ 디렉토리 (Python)
```
modal/
├── comfyui_workflow.py  # ComfyUI 워크플로우
├── config.py            # 설정
├── download_models.py   # 모델 다운로드
├── requirements.txt     # Python 의존성
├── prompts/             # 프롬프트 템플릿
└── tests/               # Python 테스트
```

## 주요 설정 파일
- `package.json` - Node.js 의존성 및 스크립트
- `tsconfig.json` - TypeScript 설정
- `eslint.config.mjs` - ESLint 설정
- `vitest.config.ts` - Vitest 테스트 설정
- `playwright.config.ts` - Playwright E2E 설정
- `next.config.ts` - Next.js 설정
- `middleware.ts` - Next.js 미들웨어
