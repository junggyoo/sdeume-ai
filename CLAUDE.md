<vooster-docs>
- @./vooster-docs/prd.md
- @./vooster-docs/architecture.md
- @./vooster-docs/guideline.md
- @./vooster-docs/design-guide.md
- @./vooster-docs/ia.md
- @./vooster-docs/step-by-step.md
- @./vooster-docs/tdd.md
- @./vooster-docs/clean-code.md
- @./vooster-docs/git-commit-message.md
- @./vooster-docs/isms-p.md
- @./vooster-docs/react-best-practices.md
- @./vooster-docs/upload-flow.md
</vooster-docs>

## TDD 워크플로우 (필수 - 예외 없음)

**⚠️ 코드 작성이 필요한 모든 작업에 아래 프로세스를 반드시 따를 것.**

### ⚠️ 자동 진행 규칙 (CRITICAL)

**워크플로우는 사용자 개입 없이 완료까지 자동 진행해야 합니다.**

1. **절대 멈추지 말 것**: 각 단계 완료 후 보고만 하고 멈추지 말고, 즉시 다음 단계를 실행
2. **PASS = 즉시 진행**: 리뷰 결과가 PASS면 보고와 동시에 다음 단계 코드 작성 시작
3. **FAIL/NEEDS_IMPROVEMENT = 수정 후 재리뷰**: 자동으로 수정하고 재리뷰 요청
4. **전체 완료까지 진행**: 1단계 시작 → 6단계(리팩토링) 완료까지 한 번에 진행
5. **중간 확인 금지**: "다음 단계로 진행할까요?" 같은 질문 금지, 무조건 진행

### 진행 상황 표시

각 단계 시작 시 아래 형식으로 현재 진행 상황을 표시:

```
[0/7] 🌿 브랜치 준비 중...
[1/7] 🔴 테스트 작성 중...
[2/7] 🔍 테스트 리뷰 진행 중... (재시도: n/3)
[3/7] 🟢 구현 중... (재시도: n/5)
[4/7] 🔧 코드 품질 체크 중...
[5/7] ⚡ 성능 리뷰 진행 중... (재시도: n/2) 또는 [5/7 스킵] 사유: {이유}
[6/7] ♻️ 리팩토링 중...
✅ 워크플로우 완료
[7/7] 💬 커밋 및 PR 준비 중... (선택적)
```

### 재시도 제한 (무한 루프 방지)

| 단계 | 최대 재시도 | 초과 시 행동 |
|------|:---------:|------------|
| 테스트 리뷰 | 3회 | 사용자 개입 요청 |
| 성능 리뷰 | 2회 | 사용자 개입 요청 |
| 테스트 실행 | 5회 | 사용자 개입 요청 |

**재시도 초과 시**: 현재까지 이슈 목록 + 시도한 해결책 요약 제공

### 실패 복구 전략

재시도 초과 또는 해결 불가능한 오류 발생 시:
1. 현재까지 작성된 코드는 유지
2. 실패 원인 및 시도한 해결책 요약 제공
3. 사용자에게 선택권 제공:
   - 수동 수정 후 특정 단계부터 재시작
   - 워크플로우 중단

### 적용 대상 (예외 없음)

- ✅ 새 기능 구현
- ✅ 기존 기능 수정/확장
- ✅ 버그 수정 (버그 재현 테스트 먼저 작성)
- ✅ 리팩토링 (기존 동작 보장 테스트 먼저 확인)
- ✅ API 엔드포인트 추가/수정
- ✅ 컴포넌트 추가/수정
- ✅ 유틸리티 함수 추가/수정

### 제외 대상

- ❌ 설정 파일 수정 (config, env 등)
- ❌ 스타일만 변경 (CSS, Tailwind 클래스)
- ❌ 타입 정의만 추가
- ❌ 주석/문서 수정
- ❌ 패키지 설치/업데이트

---

### 0단계: 브랜치 준비 (Branch Setup)

**⚠️ main/master 브랜치에서 직접 커밋 금지**

1. `git branch --show-current`로 현재 브랜치 확인
2. **main/master인 경우**:
   - 작업 내용 기반으로 브랜치명 자동 생성 또는 사용자 지정
   - `git checkout -b <type>/<description>` 실행
   - 로그: `[0/7] 🌿 브랜치 생성: feat/xxx`
3. **feature 브랜치인 경우**:
   - 현재 브랜치에서 작업 계속
   - 로그: `[0/7] 🌿 브랜치 확인: feat/xxx (기존 브랜치에서 계속)`
4. **즉시 1단계로 진행**

브랜치 네이밍 규칙은 `vooster-docs/git-commit-message.md` 참조

### 1단계: 테스트 먼저 작성 (Red Phase)

1. 요구사항 분석 후 **테스트 시나리오 목록** 작성
2. 각 시나리오에 대한 **테스트 코드 작성** (실패하는 테스트)
3. 테스트 파일 위치: `src/**/*.test.ts` 또는 `src/**/*.test.tsx`
4. 버그 수정의 경우: **버그를 재현하는 테스트** 먼저 작성

### 2단계: 자동 테스트 리뷰 (AI Review)

1. 테스트 파일 작성 후, **Task 도구로 테스트 리뷰 에이전트 호출**:

   ```
   Task 도구 호출:
   - subagent_type: "general-purpose"
   - prompt: 아래 내용 포함
     1. 테스트 파일 경로
     2. 요구사항/기능 설명
     3. .claude/commands/review-tests.md 의 리뷰 프로세스 수행 요청
   ```

2. 리뷰 에이전트가 분석 후 결과 출력:
   - **PASS**: → **즉시 3단계(구현) 시작. 멈추지 말 것.**
   - **NEEDS_IMPROVEMENT**: → 즉시 테스트 수정 → 재리뷰 호출 → PASS까지 반복
   - **FAIL**: → 즉시 테스트 재작성 → 재리뷰 호출 → PASS까지 반복

3. 리뷰 결과 형식:
   ```
   ## 테스트 리뷰 결과

   ### 평가: [PASS | NEEDS_IMPROVEMENT | FAIL]

   ### 커버리지 분석
   | 요구사항 | 테스트 여부 |
   |---------|:---------:|
   | [요구사항1] | ✅ / ❌ |

   ### 누락된 테스트 케이스
   - [ ] [추가 필요한 테스트]

   ### 개선 제안
   - [구체적인 개선 사항]
   ```

4. **⚠️ PASS 판정 없이 구현 진행 금지**

### 3단계: 구현 및 테스트 통과 (Green Phase)

1. 리뷰 PASS 후 **즉시 기능 구현 시작** (멈추지 말 것)
2. `pnpm test` 실행하여 테스트 결과 확인
3. **테스트 실패 시**: 즉시 코드 수정 → 테스트 재실행 → 통과까지 반복
4. **모든 테스트 통과 시**: → **즉시 4단계(코드 품질 체크) 진행. 멈추지 말 것.**

### 4단계: 코드 품질 체크

1. `pnpm lint` 실행
2. `pnpm typecheck` 실행
3. **오류 발생 시**: 즉시 수정 → 재실행 → 통과까지 반복
4. **통과 시**: → **즉시 5단계(성능 리뷰) 진행. 멈추지 말 것.**

### 5단계: 성능 리뷰 (React 대상) - 조건부

**스킵 조건** (아래 해당 시 `[5/7 스킵] 사유: {이유}` 로그 후 6단계로):
- 순수 유틸리티 함수만 작성한 경우
- 테스트 파일만 수정한 경우
- API 라우트만 수정한 경우

**적용 대상**: React 컴포넌트, 데이터 페칭 로직, 서버/클라이언트 컴포넌트

성능 리뷰 에이전트 호출 → PASS 시 6단계로 진행

### 6단계: 리팩토링 (Refactor Phase)

1. 테스트 통과 상태 유지하면서 코드 개선
2. 중복 제거, 네이밍 개선, 구조 단순화
3. 리팩토링 후 테스트 재실행하여 통과 확인
4. **완료 시**: 전체 워크플로우 완료 보고 (생성/수정된 파일 목록 포함)

### 7단계: 커밋 및 PR (선택적)

워크플로우 완료 시 사용자에게 질문: "변경사항을 커밋할까요?"

**승인 시 프로세스**:
1. **브랜치 확인**:
   - main/master인 경우: ⛔ 커밋 차단, feature 브랜치 생성 안내
   - feature 브랜치인 경우: 진행
2. **변경 파일 목록 표시**
3. **커밋 메시지 자동 생성** (git-commit-message.md 규칙 준수)
4. **커밋 실행**
5. **PR 생성 여부 확인**: "PR을 생성할까요?"
   - 승인 시: `gh pr create` 실행
   - 거부 시: 커밋만 완료

**main 브랜치 보호**:
- main/master에서 직접 커밋 시도 시 자동 차단
- 에러 메시지: "⛔ main 브랜치에서 직접 커밋할 수 없습니다. feature 브랜치를 생성하세요."

---

### 테스트 명령어

```bash
pnpm test           # 전체 테스트 실행
pnpm test:watch     # 변경 감지 모드
pnpm test:coverage  # 커버리지 리포트
pnpm test:e2e       # E2E 테스트
```

### 테스트 작성 규칙

- **AAA 패턴**: Arrange → Act → Assert
- **테스트 네이밍**: `describe('기능명')` → `it('should 동작 when 조건')`
- **독립적 테스트**: 테스트 간 상태 공유 금지
- **행위 테스트**: 구현 세부사항이 아닌 동작 검증

---

## React 성능 최적화 워크플로우

**React 컴포넌트 또는 데이터 페칭 코드 작성 시 적용 (5단계에서 자동 호출)**

### 성능 리뷰 에이전트 호출

```
Task 도구 호출:
- subagent_type: "general-purpose"
- prompt: 아래 내용 포함
  1. 리뷰 대상 파일 경로
  2. .claude/commands/review-performance.md 리뷰 수행 요청
```

### 리뷰 결과 처리

- **PASS**: → **즉시 6단계(리팩토링) 시작. 멈추지 말 것.**
- **WARNING**: → 즉시 HIGH 이슈 수정 → 재리뷰 호출
- **FAIL**: → 즉시 CRITICAL 이슈 수정 → 재리뷰 호출 → PASS까지 반복

### CRITICAL 규칙 (반드시 준수)

1. **Waterfall 제거**: 순차적 await → `Promise.all` 사용
2. **Barrel Import 금지**: `from 'lucide-react'` → 개별 import
3. **불필요한 'use client' 제거**: hooks 미사용 시 서버 컴포넌트 유지

---

## E2E 테스트 (선택적 - 사용자 플로우 영향 시)

### 적용 조건

- 사용자 플로우에 영향을 주는 변경 (로그인, 결제, 폼 제출 등)
- 여러 페이지에 걸친 기능 변경
- 중요한 UI 상호작용 변경

### 방법 1: 자동화 테스트 (기본 - CI/CD 용)

```bash
pnpm test:e2e        # headless 실행
pnpm test:e2e:headed # 브라우저 표시
```

- 실패 시: 코드 수정 → 재실행
- 기존 E2E 테스트가 있는 경우 반드시 실행

### 방법 2: Playwright MCP (복잡한 UI 검증 시)

**사용 시점**:
- 새 기능의 사용자 플로우 시각적 검증
- 버그 재현 및 디버깅
- 복잡한 UI 상호작용 테스트

**프로세스**:
1. Playwright MCP로 브라우저 실행
2. 사용자 플로우 직접 검증
3. 이슈 발견 시 → E2E 테스트 코드로 작성하여 회귀 방지

---

## 통합 워크플로우 (자동 진행 - 멈춤 금지)

```
[0/7] 🌿 브랜치 준비 (main → feature 브랜치 전환)
    ↓ [자동]
[1/7] 🔴 테스트 작성 (Red Phase)
    ↓ [자동]
[2/7] 🔍 테스트 리뷰 에이전트 호출 → PASS까지 (최대 3회)
    ↓ [PASS 즉시]
[3/7] 🟢 구현 (Green Phase) → 테스트 통과까지 (최대 5회)
    ↓ [통과 즉시]
[4/7] 🔧 코드 품질 체크 (lint, typecheck)
    ↓ [통과 즉시]
[5/7] ⚡ 성능 리뷰 에이전트 호출 → PASS까지 (최대 2회) [React 대상, 아니면 스킵]
    ↓ [PASS 즉시]
[6/7] ♻️ 리팩토링 (Refactor Phase)
    ↓ [완료]
✅ 최종 보고 (생성/수정 파일 목록)
    ↓ [선택적]
[7/7] 💬 커밋 및 PR (브랜치 확인 → 커밋 → PR 생성 여부)
```

**⚠️ 위 흐름에서 사용자에게 "진행할까요?" 질문 금지. 무조건 완료까지 진행.**
**⚠️ 재시도 횟수 초과 시에만 사용자 개입 요청.**

---

## 병렬 작업 가이드라인 (Git Worktree 필수)

### 병렬 작업 문제점

- 여러 터미널에서 main 브랜치에서 직접 작업 시 커밋 내용이 섞임
- Git 히스토리 관리 어려움
- 병렬 작업 간 충돌 위험

### 해결책: Git Worktree + Feature Branch

**병렬 작업 시 반드시 Git Worktree 사용**:

```bash
# 새 worktree 생성 (별도 터미널에서 작업할 때)
git worktree add ../sdeume-ai-worktrees/<branch-name> -b <type>/<description>
cd ../sdeume-ai-worktrees/<branch-name>
pnpm install

# 예시
git worktree add ../sdeume-ai-worktrees/feat-user-profile -b feat/user-profile
cd ../sdeume-ai-worktrees/feat-user-profile
pnpm install

# 작업 완료 후 정리
git worktree remove ../sdeume-ai-worktrees/<branch-name>
```

### Worktree 장점

- 각 터미널이 **독립된 작업 디렉토리** 사용
- **브랜치 전환 없이** 병렬 작업 가능
- **커밋 내용 혼재 방지**
- 각 작업별 독립적인 node_modules

### Worktree 관리 명령어

```bash
# 현재 worktree 목록 확인
git worktree list

# worktree 제거 (브랜치 유지)
git worktree remove <path>

# worktree 제거 (브랜치도 삭제)
git worktree remove <path> && git branch -d <branch-name>

# 정리 (삭제된 worktree 참조 제거)
git worktree prune
```

### 충돌 방지 규칙

1. **동일 파일 동시 수정 금지**: 병렬 작업 시작 전 수정할 파일 범위 확인
2. **main 정기 동기화**: 장기 작업 시 주기적으로 main 변경사항 병합
3. **작은 단위 커밋**: 충돌 발생 시 해결 용이하도록 작은 단위로 커밋
