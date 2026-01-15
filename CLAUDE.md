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
</vooster-docs>

## TDD 워크플로우 (필수 - 예외 없음)

**⚠️ 코드 작성이 필요한 모든 작업에 아래 프로세스를 반드시 따를 것.**

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
   - **PASS**: 3단계(구현)로 자동 진행
   - **NEEDS_IMPROVEMENT**: 피드백 기반으로 테스트 수정 → 재리뷰
   - **FAIL**: 테스트 재작성 → 재리뷰

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

1. 리뷰 PASS 후 **기능 구현 시작**
2. `pnpm test` 실행하여 테스트 결과 확인
3. **테스트 실패 시**: 코드 수정 → 테스트 재실행 → 통과까지 반복
4. **모든 테스트 통과 시**: 다음 단계로 진행

### 4단계: 리팩토링 (Refactor Phase)

1. 테스트 통과 상태 유지하면서 코드 개선
2. 중복 제거, 네이밍 개선, 구조 단순화
3. 리팩토링 후 테스트 재실행하여 통과 확인

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
