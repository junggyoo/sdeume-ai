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

## TDD 워크플로우 (필수)

**모든 기능 구현 시 아래 프로세스를 반드시 따를 것.**

### 1단계: 테스트 먼저 작성 (Red Phase)

1. 요구사항 분석 후 **테스트 시나리오 목록** 작성
2. 각 시나리오에 대한 **테스트 코드 작성** (실패하는 테스트)
3. 테스트 파일 위치: `src/**/*.test.ts` 또는 `src/**/*.test.tsx`

### 2단계: 사용자 컨펌 요청

1. 작성한 테스트 케이스를 사용자에게 **반드시 보여주고 컨펌** 받기
2. 컨펌 내용:
   - 테스트 시나리오가 요구사항을 충분히 커버하는지
   - 엣지 케이스가 누락되지 않았는지
   - 테스트 구조와 네이밍이 적절한지
3. 사용자가 수정 요청 시 테스트 코드 수정 후 재컨펌

### 3단계: 구현 및 테스트 통과 (Green Phase)

1. 사용자 컨펌 후 **기능 구현 시작**
2. `pnpm test` 실행하여 테스트 결과 확인
3. **테스트 실패 시**: 코드 수정 → 테스트 재실행 → 통과까지 반복
4. **모든 테스트 통과 시**: 다음 단계로 진행

### 4단계: 리팩토링 (Refactor Phase)

1. 테스트 통과 상태 유지하면서 코드 개선
2. 중복 제거, 네이밍 개선, 구조 단순화
3. 리팩토링 후 테스트 재실행하여 통과 확인

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
