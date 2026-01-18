# React & Next.js 성능 최적화 가이드

> Vercel Engineering의 React Best Practices (v1.0.0)를 기반으로 프로젝트에 맞게 커스터마이징한 가이드입니다.

---

## 우선순위 개요

| 우선순위 | 카테고리 | 영향도 |
|---------|---------|--------|
| CRITICAL | Waterfall 제거 | 2-10배 성능 향상 가능 |
| CRITICAL | 번들 사이즈 최적화 | 200-800ms 콜드스타트 감소 |
| HIGH | 서버 컴포넌트 최적화 | 직렬화 비용 감소 |
| MEDIUM | Re-render 최적화 | UX 개선 |
| MEDIUM | 렌더링 성능 | 초기 렌더 10배 향상 가능 |

---

## CRITICAL: Waterfall 제거

> "Waterfalls are the #1 performance killer" - Vercel Engineering

### 규칙 1: 순차적 await 금지

```typescript
// ❌ Bad: 순차 실행 (총 3초)
async function loadPageData() {
  const user = await fetchUser();      // 1초
  const posts = await fetchPosts();    // 1초
  const comments = await fetchComments(); // 1초
  return { user, posts, comments };
}

// ✅ Good: 병렬 실행 (총 1초)
async function loadPageData() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments(),
  ]);
  return { user, posts, comments };
}
```

### 규칙 2: Suspense 경계로 즉시 UI 표시

```typescript
// ❌ Bad: 모든 데이터 로딩 대기
export default async function Page() {
  const data = await fetchAllData(); // 전체 페이지 블로킹
  return <Dashboard data={data} />;
}

// ✅ Good: 독립적인 Suspense 경계
export default function Page() {
  return (
    <div>
      <Header /> {/* 즉시 표시 */}
      <Suspense fallback={<Skeleton />}>
        <UserStats /> {/* 독립 로딩 */}
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RecentActivity /> {/* 독립 로딩 */}
      </Suspense>
    </div>
  );
}
```

### 규칙 3: API Route에서 병렬 시작

```typescript
// ❌ Bad: 순차 대기
export async function POST(req: Request) {
  const body = await req.json();
  const user = await getUser(body.userId);
  await logAnalytics(body); // 불필요한 대기
  return Response.json(user);
}

// ✅ Good: 즉시 시작, 나중에 await
export async function POST(req: Request) {
  const body = await req.json();
  const userPromise = getUser(body.userId);
  const analyticsPromise = logAnalytics(body); // 먼저 시작

  const user = await userPromise;
  // analyticsPromise는 응답에 영향 없으므로 await 불필요
  return Response.json(user);
}
```

---

## CRITICAL: 번들 사이즈 최적화

### 규칙 4: Barrel Import 금지

> Barrel import는 200-800ms 콜드스타트 오버헤드 발생

```typescript
// ❌ Bad: Barrel import (전체 라이브러리 로드)
import { Download, ImageOff, Loader2 } from 'lucide-react';
import { Button, Card, Dialog } from '@/components/ui';

// ✅ Good: Direct import (필요한 것만 로드)
import { Download } from 'lucide-react';
import { ImageOff } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// 또는 더 최적화된 방식
import Download from 'lucide-react/dist/esm/icons/download';
```

**프로젝트 적용:**
- `lucide-react`는 트리쉐이킹이 잘 되어 있어 `import { Icon } from 'lucide-react'` 형태로 사용 가능 (예외)
- `@/components/ui`는 개별 파일에서 직접 import

### 규칙 5: Heavy 컴포넌트 Dynamic Import

```typescript
// ❌ Bad: 무조건 로드
import { HeavyEditor } from '@/components/HeavyEditor';

// ✅ Good: 필요할 때만 로드
import dynamic from 'next/dynamic';

const HeavyEditor = dynamic(
  () => import('@/components/HeavyEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);
```

### 규칙 6: 조건부 모듈 로딩

```typescript
// ❌ Bad: 항상 대용량 데이터 로드
import { allCountries } from '@/data/countries'; // 50KB

// ✅ Good: 기능 활성화 시에만 로드
const [countries, setCountries] = useState<Country[]>([]);

useEffect(() => {
  if (showCountrySelector) {
    import('@/data/countries').then(m => setCountries(m.allCountries));
  }
}, [showCountrySelector]);
```

---

## HIGH: 서버 컴포넌트 최적화

### 규칙 7: 기본은 서버 컴포넌트

```typescript
// ❌ Bad: 불필요한 'use client'
'use client';
export function StaticCard({ title, description }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

// ✅ Good: 서버 컴포넌트 (기본값)
export function StaticCard({ title, description }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

**'use client' 필요한 경우만:**
- `useState`, `useEffect` 등 React hooks 사용
- 브라우저 API 접근 (window, document)
- 이벤트 핸들러 (onClick, onChange)
- 애니메이션 라이브러리 (framer-motion)

### 규칙 8: RSC 경계에서 직렬화 최소화

```typescript
// ❌ Bad: 전체 객체 전달
// Server Component
const fullUser = await db.user.findUnique({ include: { posts: true, settings: true }});
return <ClientProfile user={fullUser} />; // 불필요한 데이터까지 직렬화

// ✅ Good: 필요한 필드만 전달
const user = await db.user.findUnique({ select: { id: true, name: true, avatar: true }});
return <ClientProfile user={user} />;
```

### 규칙 9: after()로 비블로킹 작업 스케줄링

```typescript
import { after } from 'next/server';

export async function POST(req: Request) {
  const data = await processRequest(req);

  // ✅ 응답 전송 후 실행 (응답 지연 없음)
  after(async () => {
    await logAnalytics(data);
    await sendNotification(data);
  });

  return Response.json(data);
}
```

---

## MEDIUM: Re-render 최적화

### 규칙 10: 상태 읽기 지연

```typescript
// ❌ Bad: 전역 상태 구독 (모든 변경에 리렌더)
function SearchButton() {
  const query = useStore(state => state.query); // 계속 리렌더
  return <button onClick={() => search(query)}>Search</button>;
}

// ✅ Good: 콜백에서 읽기 (리렌더 없음)
function SearchButton() {
  const getQuery = useStore(state => state.getQuery);
  return <button onClick={() => search(getQuery())}>Search</button>;
}
```

### 규칙 11: 메모이제이션 적절히 사용

```typescript
// ✅ 비용이 큰 계산만 메모
const sortedItems = useMemo(
  () => items.sort((a, b) => complexSort(a, b)),
  [items]
);

// ✅ 참조 안정성이 필요한 콜백만 메모
const handleSubmit = useCallback(
  (data: FormData) => onSubmit(data, userId),
  [onSubmit, userId]
);

// ❌ 과도한 메모이제이션 피하기
const name = useMemo(() => user.name, [user.name]); // 불필요
```

### 규칙 12: Transition으로 긴급하지 않은 업데이트 표시

```typescript
import { startTransition } from 'react';

function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value); // 긴급: 입력 즉시 반영

    startTransition(() => {
      setResults(search(e.target.value)); // 비긴급: 지연 가능
    });
  }

  return <input value={query} onChange={handleChange} />;
}
```

---

## MEDIUM: 렌더링 성능

### 규칙 13: content-visibility로 오프스크린 렌더링 지연

```css
/* 긴 리스트의 아이템에 적용 */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px; /* 예상 높이 */
}
```

> 긴 리스트에서 초기 렌더 ~10배 향상

### 규칙 14: 정적 JSX 호이스팅

```typescript
// ❌ Bad: 매 렌더마다 재생성
function Component() {
  return (
    <div>
      <StaticHeader /> {/* 매번 새 참조 */}
      <DynamicContent />
    </div>
  );
}

// ✅ Good: 컴포넌트 외부로 호이스팅
const staticHeader = <StaticHeader />;

function Component() {
  return (
    <div>
      {staticHeader} {/* 동일 참조 유지 */}
      <DynamicContent />
    </div>
  );
}
```

### 규칙 15: Hydration Mismatch 방지

```typescript
// ❌ Bad: 서버/클라이언트 불일치로 깜빡임
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'light');
  }, []);
  // ...
}

// ✅ Good: 인라인 스크립트로 hydration 전 DOM 업데이트
// layout.tsx
<head>
  <script dangerouslySetInnerHTML={{
    __html: `
      document.documentElement.dataset.theme =
        localStorage.getItem('theme') || 'light';
    `
  }} />
</head>
```

---

## 프로젝트 특화 규칙

### Adaptive Polling (이미 적용됨)

```typescript
// architecture.md에 정의된 패턴 유지
// Phase 1 (0~15초): 3초 간격
// Phase 2 (15~40초): 1초 간격
// Phase 3 (40초~): 3초 간격

const { data } = useQuery({
  queryKey: ['generation', jobId],
  queryFn: fetchGenerationStatus,
  refetchInterval: (data) => getAdaptiveInterval(data?.elapsed),
  enabled: !!jobId && !isComplete,
});
```

### Next.js Image 최적화 (이미 적용됨)

```typescript
// sizes 속성 필수 사용
<Image
  src={image.url}
  alt={image.alt}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isHero} // 히어로 이미지만 priority
/>
```

---

## 체크리스트

### 코드 리뷰 시 확인

- [ ] 순차적 await가 있는가? → `Promise.all` 사용
- [ ] Barrel import가 있는가? → Direct import로 변경
- [ ] 불필요한 'use client'가 있는가? → 제거
- [ ] RSC에서 전체 객체를 전달하는가? → 필요한 필드만 select
- [ ] 과도한 메모이제이션이 있는가? → 필요한 경우만 사용

### PR 머지 전 확인

- [ ] 번들 사이즈 증가가 정당한가?
- [ ] Lighthouse 성능 점수 유지되는가?
- [ ] 새로운 waterfall이 도입되지 않았는가?
