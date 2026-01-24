# PR 생성 및 CI 모니터링 커맨드

PR을 생성하고 CI 체크가 통과할 때까지 모니터링합니다. 실패 시 자동으로 수정을 시도합니다.

## 모드

- **기본 모드**: lint/format 에러만 자동 수정, 나머지는 원인 분석 + 수정 제안
- **aggressive 모드** (`--aggressive`): typecheck/test/build도 자동 수정 시도

## 실행 프로세스

### 1단계: 사전 검사 (가드레일)

```
[PR-CI] 🔍 사전 검사 중...
```

**브랜치 정책 검증:**
```bash
# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# main/master 브랜치면 즉시 종료
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  echo "❌ main/master 브랜치에서는 실행할 수 없습니다. 작업 브랜치에서 실행하세요."
  exit 1
fi

# base 브랜치 자동 감지
BASE_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
```

**uncommitted changes 확인:**
```bash
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ 커밋되지 않은 변경사항이 있습니다. 먼저 커밋하세요."
  exit 1
fi
```

**remote 동기화:**
```bash
# pull with rebase
if ! git pull --rebase --autostash; then
  echo "❌ rebase 중 충돌이 발생했습니다. 수동으로 해결하세요."
  git status --short
  exit 1
fi
```

**기존 PR 확인:**
```bash
# GitHub username 또는 org 이름
OWNER=$(gh repo view --json owner --jq '.owner.login')
EXISTING_PR=$(gh pr list --head "$OWNER:$CURRENT_BRANCH" --state open --json number,url --jq '.[0]')

if [[ -n "$EXISTING_PR" ]]; then
  PR_NUMBER=$(echo "$EXISTING_PR" | jq -r '.number')
  PR_URL=$(echo "$EXISTING_PR" | jq -r '.url')
  echo "ℹ️ 기존 PR 발견: #$PR_NUMBER"
else
  PR_NUMBER=""
  PR_URL=""
fi
```

---

### 2단계: PR 생성 (없는 경우)

```
[PR-CI] 📤 PR 생성 중...
```

```bash
if [[ -z "$PR_NUMBER" ]]; then
  # push if needed
  git push -u origin "$CURRENT_BRANCH"

  # create PR with auto-fill
  PR_URL=$(gh pr create --fill --json url --jq '.url')
  PR_NUMBER=$(gh pr view --json number --jq '.number')
  echo "✅ PR 생성 완료: $PR_URL"
else
  echo "ℹ️ 기존 PR 사용: $PR_URL"
fi
```

---

### 3단계: CI 모니터링

```
[PR-CI] 🔄 CI 모니터링 중... (PR: #$PR_NUMBER)
```

**run-id 획득 (PR head SHA 기준):**
```bash
# PR의 head SHA 확보
HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid --jq '.headRefOid')

# 해당 SHA의 workflow run 조회 (최대 20개)
RUNS=$(gh run list --commit "$HEAD_SHA" --json databaseId,conclusion,status --limit 20)
```

**CI 체크 모니터링:**
```bash
# --watch: 완료까지 대기
# --fail-fast: 하나라도 실패하면 즉시 종료
# --interval: 10초마다 체크
gh pr checks "$PR_NUMBER" --watch --fail-fast --interval 10
```

**결과 처리:**
- 성공 시 → 완료 보고
- 실패 시 → 4단계로 이동

---

### 4단계: 실패 분석 및 자동 수정 (최대 3회)

```
[PR-CI] ❌ CI 실패 감지 - 분석 중... (재시도: n/3)
```

**에러 유형 감지 (2중화):**

1차: job/workflow 이름 매칭
```bash
FAILED_JOBS=$(gh run view "$RUN_ID" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name')
```

2차: 로그 키워드 매칭
```bash
# 실패한 job의 로그 조회
gh run view "$RUN_ID" --log-failed
```

| 에러 유형 | job명 패턴 | 로그 키워드 |
|----------|-----------|------------|
| ESLint | `lint`, `eslint` | `ESLint`, `error ` |
| Prettier/Format | `format`, `prettier` | `Prettier`, `formatting` |
| TypeScript | `typecheck`, `type-check`, `tsc` | `TS\d{4}`, `Type error`, `error TS` |
| Unit Test | `test`, `vitest`, `jest` | `FAIL`, `✗`, `AssertionError` |
| Build | `build`, `next build` | `Build failed`, `Module not found` |
| E2E | `e2e`, `playwright` | `browserType.launch`, `Timeout` |
| Lockfile | `install`, `ci` | `ERR_PNPM_`, `lockfile` |

**에러 유형별 대응:**

| 에러 유형 | 기본 모드 | aggressive 모드 |
|----------|----------|----------------|
| lint/format | `pnpm lint --fix` 또는 `pnpm format` 자동 실행 | 동일 |
| typecheck | 원인 요약 + 수정 제안 출력 | 자동 수정 시도 |
| test | 원인 요약 + 수정 제안 출력 | 자동 수정 시도 |
| build | 원인 요약 + 수정 제안 출력 | 자동 수정 시도 |
| e2e (flaky) | `gh run rerun "$RUN_ID"` (1회만) | 동일 |
| e2e (코드) | 원인 요약 + 수정 제안 출력 | 자동 수정 시도 |
| lockfile | **자동 수정 금지** - 안내만 출력 | 동일 (금지) |

**E2E flaky 판단 기준:**
- 네트워크 관련 에러 (`ECONNREFUSED`, `timeout`)
- 캐시/환경 관련 (`browserType.launch`, `browser.newContext`)
- 이전 같은 코드에서 성공한 기록이 있는 경우

**커밋 조건:**
```bash
# 변경 확인
if git diff --quiet && git diff --cached --quiet; then
  echo "ℹ️ 변경사항 없음 - 커밋 스킵"
else
  # 변경된 파일 확인
  git status --porcelain

  # 커밋 (attempt 번호 포함)
  git add -A
  git commit -m "fix(ci): auto-fix lint (attempt $ATTEMPT/3)"
  git push
fi
```

**커밋 메시지 규칙:**
- `fix(ci): auto-fix lint (attempt 1/3)`
- `fix(ci): typecheck errors (attempt 2/3)`
- `fix(ci): failing tests (attempt 1/3)`

**push 후 3단계로 복귀**

---

### 5단계: 결과 보고

**성공:**
```
✅ PR #42 생성 완료 - 모든 CI check 통과!
   URL: https://github.com/owner/repo/pull/42
```

**실패 (3회 초과):**
```
❌ CI 자동 수정 실패 (3회 재시도 초과)

## 해결되지 않은 이슈
- [ ] TypeScript 에러: src/components/Button.tsx:42 - Type 'string' is not assignable to type 'number'
- [ ] Test 실패: src/utils/format.test.ts - Expected "hello" but received "world"

## 시도한 수정
1. lint --fix 적용 (성공)
2. TypeScript 에러 수정 시도 (실패 - 타입 정의 필요)
3. Test 수정 시도 (실패 - 로직 검토 필요)

## 수동 확인 필요 항목
- src/components/Button.tsx: Props 타입 정의 검토
- src/utils/format.test.ts: 기대값 또는 구현 로직 검토

PR URL: https://github.com/owner/repo/pull/42
```

---

## 재시도 제한

| 단계 | 최대 재시도 | 초과 시 |
|------|:---------:|--------|
| CI 코드 수정 | 3회 | 사용자 개입 요청 |
| E2E rerun (flaky) | 1회 | 코드 수정 루프로 전환 |

---

## 운영 규칙

1. **main/master 브랜치 금지**: 작업 브랜치에서만 실행
2. **충돌 시 자동 중단**: rebase 충돌 발생 시 사용자 개입 필요
3. **변경 없으면 커밋 금지**: `git diff --quiet` 체크
4. **lockfile 에러 수정 금지**: 의존성 문제는 위험하므로 안내만 출력
5. **aggressive 모드 주의**: typecheck/test 자동 수정은 예상치 못한 결과 가능

---

## 진행 상황 표시

```
[PR-CI] 🔍 사전 검사 중... (브랜치: feat/xxx, base: main)
[PR-CI] 📤 PR 생성 중...
[PR-CI] ✅ PR #42 생성 완료
[PR-CI] 🔄 CI 모니터링 중... (SHA: abc1234)
        └─ lint: ✅ passed
        └─ typecheck: ✅ passed
        └─ test: ⏳ running...
        └─ build: ⏳ pending
[PR-CI] ❌ test 실패 - 분석 중...
[PR-CI] 🔧 pnpm lint --fix 실행 중... (재시도: 1/3)
[PR-CI] 📤 수정사항 push 중... (fix(ci): auto-fix lint)
[PR-CI] 🔄 CI 재실행 모니터링 중...
[PR-CI] ✅ 모든 CI check 통과!

✅ PR #42 - 모든 CI check 통과!
   URL: https://github.com/owner/repo/pull/42
```

---

## 사용 예시

```bash
# 기본 모드 (lint/format만 자동 수정)
/pr-ci-watch

# aggressive 모드 (모든 에러 자동 수정 시도)
/pr-ci-watch --aggressive
```
