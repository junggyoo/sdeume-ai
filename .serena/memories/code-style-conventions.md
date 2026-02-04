# Code Style & Conventions

## 명명 규칙

### TypeScript/JavaScript
- **변수/함수:** `camelCase` (예: `userName`, `getImageData`)
- **상수:** `UPPER_SNAKE_CASE` (예: `MAX_RETRIES`)
- **클래스:** `PascalCase` (예: `ImageProcessor`)
- **인터페이스/타입:** `PascalCase` (예: `UserProfile`)
- **파일명:** `kebab-case` (예: `user-profile.tsx`)
- **Boolean:** `is/has/can` 접두사 (예: `isLoading`, `hasError`)

### Python (Modal)
- **함수/변수:** `snake_case`
- **클래스:** `PascalCase`
- **상수:** `UPPER_SNAKE_CASE`

## 타입 정의
- 모든 함수 매개변수, 반환 값에 명시적 타입 선언
- `any` 사용 최소화 (필요시에만)
- Zod를 활용한 런타임 검증

## 임포트 규칙
- **절대 경로 사용:** `@/` 접두사 (예: `import { Button } from '@/components/ui/button'`)
- 깊은 상대 경로 금지 (`../../../../` 등)

## 컴포넌트 구조
- 단일 책임 원칙 준수
- 복잡한 로직은 커스텀 훅으로 분리
- Server Component 우선, 필요시에만 `'use client'`

## 함수 작성
- 최대 20줄 (가급적 10줄 이하)
- 최대 3개 매개변수 (초과 시 객체 사용)
- Early return 패턴 선호
- 순수 함수에 side effect 금지

## 에러 핸들링
- `try-catch`로 명시적 처리
- 에러 무시 금지
- 로깅 및 사용자 피드백 제공

## Design Token
- Tailwind CSS 클래스에 Design Token 사용
- 하드코딩된 색상/간격 값 금지

## 테스트 작성
- **AAA 패턴:** Arrange, Act, Assert
- **네이밍:** `describe('기능명')` → `it('should 동작 when 조건')`
- 독립적 테스트 (상태 공유 금지)
- 행위 테스트 (구현 세부사항 아닌 동작 검증)

## Git Commit
- **Format:** `<type>(<scope>): <description>`
- **Types:** feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
- 설명은 50자 이내, 명령형, 소문자 시작, 마침표 없음
- **Branch:** `<type>/<short-description>` (예: `feat/user-profile`)
