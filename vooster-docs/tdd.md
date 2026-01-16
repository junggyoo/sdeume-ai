
# TDD Process Guidelines - Cursor Rules

## ⚠️ MANDATORY: Follow these rules for EVERY implementation and modification

**This document defines the REQUIRED process for all code changes. No exceptions without explicit team approval.**

## Core Cycle: Red → Green → Refactor

### 1. RED Phase
- Write a failing test FIRST
- Test the simplest scenario
- Verify test fails for the right reason
- One test at a time

### 2. GREEN Phase  
- Write MINIMAL code to pass
- "Fake it till you make it" is OK

- YAGNI principle

### 3. REFACTOR Phase
- Remove duplication
- Improve naming
- Simplify structure
- Keep tests passing

## Test Quality: FIRST Principles
- **Fast**: Milliseconds, not seconds
- **Independent**: No shared state
- **Repeatable**: Same result every time
- **Self-validating**: Pass/fail, no manual checks
- **Timely**: Written just before code

## Test Structure: AAA Pattern
```
// Arrange
Set up test data and dependencies

// Act
Execute the function/method

// Assert
Verify expected outcome
```

## Implementation Flow
1. **List scenarios** before coding
2. **Pick one scenario** → Write test
3. **Run test** → See it fail (Red)
4. **Implement** → Make it pass (Green)
5. **Refactor** → Clean up (Still Green)
6. **Commit** → Small, frequent commits
7. **Repeat** → Next scenario

## Test Pyramid Strategy
- **Unit Tests** (70%): Fast, isolated, numerous
- **Integration Tests** (20%): Module boundaries
- **Acceptance Tests** (10%): User scenarios

## Outside-In vs Inside-Out
- **Outside-In**: Start with user-facing test → Mock internals → Implement details
- **Inside-Out**: Start with core logic → Build outward → Integrate components

## Common Anti-patterns to Avoid
- Testing implementation details
- Fragile tests tied to internals
- Missing assertions
- Slow, environment-dependent tests
- Ignored failing tests

---

## Mock 전략

### Mock 해야 하는 것 (White List)
- 외부 API 호출 (Supabase, 3rd party)
- 브라우저 API (localStorage, navigator)
- 외부 라이브러리의 부작용 함수 (face-api.js 모델 로딩)
- 시간 관련 함수 (Date.now, setTimeout)
- 전역 스토어 (zustand store)

### Mock 하면 안 되는 것 (Black List)
- **같은 모듈의 순수 함수** (determineCropMode, assignSmartMixModes 등)
- **비즈니스 로직** (임계값 계산, 상태 전환, 분류 알고리즘)
- **타입 변환 유틸리티** (DTO 변환, 데이터 매핑)

### Mock 경계 판단 흐름도
```
질문 1: 외부 시스템 의존? (API, DB, 파일시스템)
  → Yes → Mock
  → No → 질문 2로

질문 2: 부작용(네트워크, I/O)?
  → Yes → Mock
  → No → 질문 3으로

질문 3: 순수 함수 또는 핵심 비즈니스 로직?
  → Yes → 실제 구현 테스트 (Mock 금지)
  → No → 상황에 따라 판단
```

### Mock 예시
```typescript
// ❌ WRONG: 핵심 비즈니스 로직 Mock
vi.mock('../lib/smart-mix', () => ({
  determineCropMode: () => 'face', // 실제 30% 임계값 로직 검증 불가
  assignSmartMixModes: () => new Map(), // 할당 알고리즘 검증 불가
}));

// ✅ CORRECT: 외부 의존성만 Mock, 비즈니스 로직은 실제 구현 사용
vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));
vi.mock('@/features/upload/store/upload-store');

import { determineCropMode } from '../lib/smart-mix';
expect(determineCropMode(imageWith35PercentFace)).toBe('body');
```

---

## 테스트 데이터 전략

### 핵심 원칙
1. **타입 완전 준수**: 실제 코드에서 사용하는 모든 필드 포함
2. **경계값 테스트**: 임계값 ±1% 근처 데이터 필수
3. **실패 케이스 포함**: 감지 실패, 에러 상황 테스트

### Factory 함수 패턴 (필수)
```typescript
// ❌ WRONG: 불완전한 데이터 (faceBox 누락)
const mockImage = {
  analysis: { faceDetected: true, confidence: 0.9 },
};

// ✅ CORRECT: 완전한 데이터 + Factory 함수
function createImageWithFace(overrides?: Partial<FaceAnalysisResult>) {
  return {
    id: `img-${Math.random().toString(36).slice(2)}`,
    analysis: {
      faceDetected: true,
      confidence: 0.85,
      faceBox: { x: 100, y: 50, width: 200, height: 250 },
      ...overrides,
    },
    imageHeight: 1000,
  };
}

function createImageWithoutFace() {
  return {
    id: `img-${Math.random().toString(36).slice(2)}`,
    analysis: { faceDetected: false, faceBox: undefined },
    imageHeight: 1000,
  };
}
```

### 필수 테스트 케이스
- 정상 케이스 (happy path)
- 감지 실패 케이스 (faceDetected: false)
- 경계값 (임계값 정확히, 임계값 -1%, 임계값 +1%)
- 다양한 입력 크기 (최소/최대/일반)

---

## 통합 테스트 전략

### 테스트 피라미드 구체화
| 계층 | 비율 | 대상 | Mock 범위 |
|------|------|------|----------|
| Unit | 70% | 순수 함수, 유틸리티 | 없음 또는 외부 API만 |
| Integration | 20% | Hook + Component 조합 | 스토어, 외부 API |
| E2E | 10% | 사용자 흐름 전체 | 없음 (실제 환경) |

### 통합 테스트 작성 시점
1. Mock된 모듈이 **핵심 비즈니스 로직**일 때
2. 여러 컴포넌트가 **상태를 공유**할 때
3. 데이터 흐름이 **3개 이상 모듈**을 거칠 때

### 통합 테스트 예시
```typescript
// Hook + Component 실제 통합
describe('SmartMix Integration', () => {
  it('should apply body crop when face is large (>30%)', () => {
    // Mock: 외부 스토어만
    vi.mock('@/features/upload/store/upload-store');

    // Real: smart-mix 로직 (determineCropMode)
    const images = [createImageWithFace({ faceBox: { height: 350 } })];
    const { result } = renderHook(() => useSmartMix());

    // 실제 determineCropMode 로직 실행 검증
    expect(result.current.images[0].cropMode).toBe('body'); // 35% > 30%
  });
});
```

---

## When Tests Fail
1. **Identify**: Regression, flaky test, or spec change?
2. **Isolate**: Narrow down the cause
3. **Fix**: Code bug or test bug
4. **Learn**: Add missing test cases

## Team Practices
- CI/CD integration mandatory
- No merge without tests
- Test code = Production code quality
- Pair programming for complex tests
- Regular test refactoring

## Pragmatic Exceptions
- UI/Graphics: Manual + snapshot tests
- Performance: Benchmark suites
- Exploratory: Spike then test
- Legacy: Test on change

## Remember
- Tests are living documentation
- Test behavior, not implementation
- Small steps, fast feedback
- When in doubt, write a test
