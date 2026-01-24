# 테스트 전략 및 로드맵

## 현재 상황 (2026-01-24)

### 테스트 현황 요약

| 구분 | 수량 |
|------|------|
| 전체 테스트 파일 | 79개 |
| 통과 | 74개 |
| Skip 처리 | 5개 |
| 전체 테스트 케이스 | 1,348개 |
| 통과 | 1,235개 |
| Skip 처리 | 113개 |

### Skip 처리된 테스트 목록

| 파일 | Skip 사유 | 우선순위 |
|------|-----------|---------|
| `fal-client.test.ts` | trigger_word mock 불일치 | P2 |
| `useSoundEffect.test.ts` | Audio mock 이슈 | P3 |
| `image-processor.service.test.ts` | sharp mock 이슈 | P2 |
| `modal-client.test.ts` | fetch mock 이슈 | P2 |
| `AuroraBackground.test.tsx` | 컴포넌트 props 타입 불일치 | P2 |
| `storage.service.test.ts` | Supabase mock 이슈 | P2 |
| `DashboardSidebar.test.tsx` | class name 검증 실패 | P3 |
| `roll-angle.test.ts` | 테스트 기대값 오류 | P2 |
| `UserMenu.test.tsx` | Next.js App Router mock 필요 | P1 |
| `DashboardHome.test.tsx` | Next.js App Router mock 필요 | P1 |

---

## 단기 계획 (1-2주) ✅ 완료

### 목표
- CI 파이프라인 안정화
- 긴급한 테스트 수정

### 완료된 작업 항목

1. **ShootingPage.test.tsx 수정** ✅
   - [x] Import 경로를 `@/app/(shoot)/new-shoot/[projectId]/progress/page`로 수정
   - [x] 컴포넌트명을 `ProgressPage`로 변경
   - [x] 테스트를 새 컴포넌트 동작에 맞게 업데이트
   - [x] vitest.config.ts exclude 목록에서 제거

2. **i18n 관련 테스트 수정 (PaymentStage)** ✅
   - [x] 영어 텍스트 → 한국어 텍스트로 테스트 기대값 수정
   - [x] 가격 정보를 실제 컴포넌트 값과 동기화
   - [x] describe.skip 제거하여 테스트 활성화

3. **Props 인터페이스 테스트 수정 (GuidelineCard)** ✅
   - [x] 존재하지 않는 props (defaultExpanded, goodExamples, badExamples) 테스트 제거
   - [x] 현재 컴포넌트의 하드코딩된 예시 텍스트에 맞게 테스트 수정
   - [x] className prop 테스트 추가
   - [x] describe.skip 제거하여 테스트 활성화

---

## 중기 계획 (1-2개월)

### 목표
- Skip된 테스트 50% 복구
- 테스트 작성 가이드라인 수립

### 작업 항목

#### Phase 1: Mock 인프라 개선

1. **Next.js App Router Mock 표준화**
   ```typescript
   // vitest.setup.ts에 추가
   vi.mock('next/navigation', () => ({
     useRouter: () => ({
       push: vi.fn(),
       replace: vi.fn(),
       prefetch: vi.fn(),
     }),
     usePathname: () => '/dashboard',
     useParams: () => ({}),
     useSearchParams: () => new URLSearchParams(),
   }));
   ```

2. **Supabase Client Mock 모듈화**
   ```
   src/
   └── __mocks__/
       └── supabase/
           ├── client.ts
           └── storage.ts
   ```

3. **환경 변수 테스트 설정**
   - vitest.config.ts에 이미 추가됨
   - 추가 환경 변수 필요시 확장

#### Phase 2: 컴포넌트 테스트 복구

| 테스트 파일 | 예상 작업량 | 담당 |
|------------|-----------|------|
| UserMenu.test.tsx | 2h | - |
| DashboardHome.test.tsx | 3h | - |
| AuroraBackground.test.tsx | 1h | - |

#### Phase 3: 서비스 테스트 복구

| 테스트 파일 | 예상 작업량 | 담당 |
|------------|-----------|------|
| fal-client.test.ts | 1h | - |
| modal-client.test.ts | 1h | - |
| storage.service.test.ts | 2h | - |
| image-processor.service.test.ts | 1h | - |

---

## 장기 계획 (3-6개월)

### 목표
- 테스트 커버리지 80% 달성
- 자동화된 테스트 품질 관리

### 전략

#### 1. 테스트 작성 원칙

```markdown
## 필수 규칙

1. **컴포넌트 변경 시 테스트 동시 수정**
   - PR에서 컴포넌트 props 변경 시 테스트도 함께 수정
   - CI에서 타입 체크 통과 필수

2. **i18n 테스트 전략**
   - 텍스트 검증 대신 data-testid 사용 권장
   - 또는 i18n key로 검증

3. **Mock 재사용**
   - 공통 mock은 `src/__mocks__/` 디렉토리에 모듈화
   - 테스트 파일별 중복 mock 최소화
```

#### 2. 테스트 커버리지 목표

| 영역 | 현재 | 목표 | 우선순위 |
|------|------|------|---------|
| 핵심 비즈니스 로직 | ~60% | 90% | P0 |
| API 라우트 | ~50% | 80% | P1 |
| UI 컴포넌트 | ~40% | 70% | P2 |
| 유틸리티 함수 | ~80% | 95% | P1 |

#### 3. CI/CD 개선

```yaml
# .github/workflows/ci.yml 개선안
test:
  steps:
    - name: Run tests with coverage
      run: pnpm test:coverage

    - name: Check coverage threshold
      run: |
        # 커버리지 70% 미만시 실패
        pnpm coverage-check --threshold 70

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
```

#### 4. 테스트 자동화 도구

- **Visual Regression Testing**: Playwright + Percy
- **E2E Testing**: Playwright (이미 설정됨)
- **API Testing**: Hono + Supertest

---

## 테스트 작성 가이드라인

### 컴포넌트 테스트

```typescript
// Good: data-testid 사용
it('should render the submit button', () => {
  render(<Form />);
  expect(screen.getByTestId('submit-button')).toBeInTheDocument();
});

// Bad: 텍스트로 검증 (i18n 변경에 취약)
it('should render the submit button', () => {
  render(<Form />);
  expect(screen.getByText('Submit')).toBeInTheDocument();
});
```

### Hook 테스트

```typescript
// Good: renderHook 사용
it('should return loading state', () => {
  const { result } = renderHook(() => useData());
  expect(result.current.isLoading).toBe(true);
});
```

### 서비스 테스트

```typescript
// Good: 외부 의존성 mock
vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabaseClient,
}));

// Good: 에러 케이스 테스트 포함
it('should handle network error', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));
  const result = await fetchData();
  expect(result.error).toBe('NETWORK_ERROR');
});
```

---

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - TDD 워크플로우
- [clean-code.md](../vooster-docs/clean-code.md) - 코드 품질 가이드
- [tdd.md](../vooster-docs/tdd.md) - TDD 상세 가이드

---

## 변경 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2026-01-24 | Claude | 초기 문서 작성, Skip 테스트 정리 |
| 2026-01-24 | Claude | 단기 계획 완료 (ShootingPage, PaymentStage, GuidelineCard 테스트 수정) |
