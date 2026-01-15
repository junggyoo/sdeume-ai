# Sdeume AI 코드 가이드라인

## 1. 프로젝트 개요

Sdeume AI 프로젝트는 사용자가 업로드한 얼굴 사진을 기반으로 AI 웨딩 화보를 생성하는 웹 기반 버추얼 스튜디오입니다. 본 가이드라인은 Next.js (TypeScript), Modal (Python), Supabase를 포함하는 기술 스택 전반에 걸쳐 일관되고 유지보수 가능한 고품질 코드 작성을 목표로 합니다.

**핵심 아키텍처 결정:**

*   **프론트엔드:** Next.js 14 (App Router)를 사용하여 서버/클라이언트 번들 통합, SEO 및 SSR 최적화를 추구합니다.
*   **AI 연산:** 고부하 이미지 생성 및 영상 렌더링은 Modal (Python) 서버리스 GPU 클라우드를 활용하여 메인 서비스와 분리합니다.
*   **데이터 계층:** Supabase (PostgreSQL, Storage, Auth)를 단일 소스로 사용하여 개발 및 운영 복잡도를 최소화합니다.
*   **실시간 UX:** Adaptive Polling 및 Web Push Notification을 통해 사용자 경험을 최적화합니다.
*   **디자인 시스템:** Tailwind CSS와 Framer Motion을 기반으로 Design Token을 활용하여 UI 일관성을 확보합니다.

## 2. 핵심 원칙

1.  **명확성 (Clarity):** 코드는 작성자의 의도를 명확히 드러내야 하며, 주석 없이도 이해하기 쉬워야 합니다.
2.  **모듈화 (Modularity):** 각 기능은 독립적이고 재사용 가능한 작은 단위로 분리되어야 하며, 응집도는 높고 결합도는 낮아야 합니다.
3.  **성능 최적화 (Performance Optimization):** 사용자 경험을 최우선으로 고려하여, 클라이언트 및 서버 측 성능 병목 현상을 최소화해야 합니다.
4.  **보안 (Security):** 사용자 데이터 보호 및 시스템 무결성을 위해 Supabase RLS, 서명된 URL 등 보안 기능을 적극적으로 활용해야 합니다.
5.  **확장성 (Scalability):** 새로운 기능이나 테마 추가 시 기존 코드 변경을 최소화할 수 있도록 유연하게 설계되어야 합니다.

## 3. 언어별 가이드라인

### 3.1. TypeScript (Next.js 프론트엔드/백엔드)

#### 3.1.1. 파일 구조 및 디렉토리 구성

*   **MUST:** `features/[domain]` 구조를 사용하여 도메인별로 코드를 구성합니다. 각 도메인 폴더는 해당 도메인에 관련된 모든 컴포넌트, 훅, API 호출 등을 포함합니다.
    ```
    src/
    ├── app/
    ├── components/
    ├── features/
    │   ├── upload/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── api/
    │   │   ├── types/
    │   │   └── index.ts
    │   ├── gallery/
    │   │   ├── components/
    │   │   └── ...
    │   └── ...
    ├── lib/ (공통 유틸리티, 헬퍼 함수)
    ├── styles/
    └── types/ (글로벌 타입 정의)
    ```
*   **MUST:** Next.js API Routes는 `app/api/[route]/route.ts`에 위치하며, 비즈니스 로직은 `lib/services` 또는 `packages/domain`으로 분리합니다.

#### 3.1.2. 임포트/의존성 관리

*   **MUST:** 절대 경로 임포트 (`@/`)를 사용하여 가독성을 높이고 경로 변경에 유연하게 대응합니다.
    ```typescript
    // MUST: 절대 경로 임포트 사용
    import { Button } from '@/components/ui/button';
    import { useUploadStore } from '@/features/upload/hooks/useUploadStore';
    ```
*   **MUST NOT:** 상대 경로 임포트를 깊게 중첩하여 사용합니다.
    ```typescript
    // MUST NOT: 깊은 상대 경로 임포트
    import { Button } from '../../../../components/ui/button';
    ```

#### 3.1.3. 에러 핸들링 패턴

*   **MUST:** 비동기 작업(API 호출)에서는 `try-catch` 블록을 사용하여 에러를 명시적으로 처리하고, 사용자에게 피드백을 제공합니다.
    ```typescript
    // MUST: 비동기 에러 명시적 처리
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        // 사용자에게 에러 메시지 표시
        throw error; // 에러를 다시 throw하여 상위 컴포넌트에서 처리 가능
      }
    }
    ```
*   **MUST NOT:** 에러를 단순히 `catch`하고 아무런 처리 없이 무시합니다.
    ```typescript
    // MUST NOT: 에러 무시
    async function fetchData() {
      try {
        await fetch('/api/data');
      } catch (error) {
        // 아무것도 하지 않음
      }
    }
    ```

### 3.2. Python (Modal AI Compute)

#### 3.2.1. 파일 구조 및 디렉토리 구성

*   **MUST:** Modal 애플리케이션은 `modal_app.py`와 같이 단일 진입점을 가지며, 내부 로직은 `lib/`, `pipelines/` 등의 디렉토리로 모듈화합니다.
    ```
    modal_app.py
    lib/
    ├── comfy_utils.py
    └── video_renderer.py
    pipelines/
    ├── image_generation.py
    └── video_generation.py
    ```
*   **MUST:** 각 Modal 함수 (`@app.function`)는 명확한 단일 책임을 가집니다.

#### 3.2.2. 임포트/의존성 관리

*   **MUST:** `requirements.txt` 또는 `modal.Image.pip_install()`을 사용하여 모든 Python 의존성을 명시적으로 관리합니다.
    ```python
    # modal_app.py
    import modal

    # ...

    image = modal.Image.debian_slim().pip_install(
        "torch", "transformers", "accelerate", "diffusers", "moviepy"
    )

    @modal.stub(image=image)
    class SdeumeAI:
        # ...
    ```

#### 3.2.3. 에러 핸들링 패턴

*   **MUST:** Modal 함수 내에서 발생할 수 있는 예외는 `try-except` 블록으로 처리하고, 상세한 로그를 남겨 모니터링에 활용합니다.
    ```python
    # MUST: Modal 함수 내 에러 처리 및 로깅
    import logging

    logger = logging.getLogger(__name__)

    @stub.function()
    def generate_image_task(params: dict):
        try:
            # 이미지 생성 로직
            result = perform_generation(params)
            return {"status": "success", "data": result}
        except Exception as e:
            logger.error(f"이미지 생성 실패: {e}", exc_info=True)
            return {"status": "failed", "error": str(e)}
    ```

## 4. 코드 스타일 규칙

### 4.1. MUST 준수 사항

*   **변수/함수명 명명 규칙:**
    *   **MUST:** `camelCase`를 사용하여 변수, 함수, 메서드 이름을 명명합니다. (예: `userName`, `getImageData`).
    *   **MUST:** 상수(전역 또는 모듈 수준)는 `UPPER_SNAKE_CASE`를 사용합니다. (예: `MAX_RETRIES`).
    *   **이유:** 코드 가독성을 높이고 일관된 명명 규칙을 통해 혼란을 방지합니다.
*   **타입 정의:**
    *   **MUST:** 모든 함수 매개변수, 반환 값, 변수에 명시적인 타입을 선언합니다. (TypeScript).
    *   **이유:** 타입 안정성을 확보하고 개발 중 발생할 수 있는 오류를 사전에 방지하며, 코드 자동 완성 기능을 향상시킵니다.
    ```typescript
    // MUST: 명시적인 타입 선언
    interface User {
      id: string;
      name: string;
      email: string;
    }

    function getUser(id: string): User | undefined {
      // ...
    }
    ```
*   **컴포넌트 분리:**
    *   **MUST:** React 컴포넌트는 단일 책임을 가지도록 작게 분리합니다. 복잡한 로직이나 상태는 커스텀 훅으로 분리합니다.
    *   **이유:** 재사용성을 높이고 테스트를 용이하게 하며, 컴포넌트의 가독성을 향상시킵니다.
*   **Design Token 사용:**
    *   **MUST:** Tailwind CSS 클래스 대신 `tailwind.config.ts`에 정의된 Design Token (색상, 폰트, 간격 등)을 사용합니다.
    *   **이유:** 디자인 시스템의 일관성을 유지하고, 디자이너와 개발자 간의 소통을 원활하게 합니다.
    ```typescript
    // tailwind.config.ts (예시)
    // ...
    colors: {
      primary: '#0E1B2A',
      secondary: '#F6F1EA',
    },
    // ...

    // MUST: Design Token 사용
    <div className="bg-primary text-secondary">...</div>
    ```
*   **Web Push Notification 구현:**
    *   **MUST:** FCM (Firebase Cloud Messaging) 또는 VAPID를 사용하여 학습 완료 및 촬영 시작 알림 기능을 구현합니다.
    *   **이유:** 사용자 이탈 방지 및 실시간 피드백 제공을 통한 UX 최적화를 위해 필수적입니다.

### 4.2. MUST NOT 금지 사항

*   **단일 파일 내 거대한 모듈:**
    *   **MUST NOT:** 수백 라인 이상의 코드를 포함하는 단일 파일 컴포넌트나 유틸리티 모듈을 작성합니다.
    *   **이유:** 가독성을 저해하고 유지보수를 어렵게 만들며, 코드 재사용성을 떨어뜨립니다.
*   **복잡한 전역 상태 관리 패턴:**
    *   **MUST NOT:** 불필요하게 복잡하거나 과도한 전역 상태 관리 라이브러리 (예: Redux)를 도입합니다. TanStack Query와 React Context/Zustand로 충분합니다.
    *   **이유:** 프로젝트의 복잡도를 증가시키고 학습 곡선을 높이며, Next.js의 서버 컴포넌트 이점을 활용하기 어렵게 만듭니다.
*   **하드코딩된 값:**
    *   **MUST NOT:** 색상 코드, 간격 값, API 엔드포인트 등을 코드 내에 직접 하드코딩합니다.
    *   **이유:** 유지보수를 어렵게 하고, 디자인 변경이나 환경 설정 변경 시 많은 코드 수정이 필요하게 만듭니다.
    ```typescript
    // MUST NOT: 하드코딩된 값
    <div style={{ backgroundColor: '#0E1B2A', padding: '16px' }}>...</div>
    ```
*   **클라이언트 측 민감 정보 저장:**
    *   **MUST NOT:** API 키, 비밀번호 등 민감한 정보를 클라이언트 측 코드나 환경 변수에 직접 노출합니다.
    *   **이유:** 보안 취약점을 발생시켜 사용자 데이터 유출의 위험을 초래합니다. 모든 민감 정보는 서버 측에서 안전하게 관리되어야 합니다.

## 5. 아키텍처 패턴

### 5.1. 컴포넌트/모듈 구조 가이드라인

*   **Atomic Design 원칙 적용:**
    *   **원자 (Atoms):** 버튼, 입력 필드 등 가장 작은 UI 요소. (예: `components/ui/Button.tsx`)
    *   **분자 (Molecules):** 원자들의 조합으로 의미 있는 기능 수행. (예: `components/common/ImageUploadInput.tsx`)
    *   **유기체 (Organisms):** 분자들과 원자들의 조합으로 복잡한 섹션 구성. (예: `features/upload/components/UploadForm.tsx`)
    *   **템플릿 (Templates):** 페이지의 레이아웃 구조 정의. (예: `app/(main)/layout.tsx`)
    *   **페이지 (Pages):** 실제 콘텐츠가 채워진 템플릿. (예: `app/(main)/upload/page.tsx`)
    *   **이유:** 재사용성, 일관성, 유지보수성을 높입니다.

### 5.2. 데이터 흐름 패턴

*   **단방향 데이터 흐름 (Unidirectional Data Flow):**
    *   **MUST:** React 컴포넌트 간 데이터는 상위 컴포넌트에서 하위 컴포넌트로 `props`를 통해 전달됩니다. 하위 컴포넌트에서 상위 컴포넌트의 데이터를 변경해야 할 경우, 상위 컴포넌트에서 전달받은 콜백 함수를 호출합니다.
    *   **이유:** 데이터의 예측 가능성을 높이고 디버깅을 용이하게 합니다.
*   **서버-클라이언트 통신:**
    *   **MUST:** RESTful API를 중심으로 통신하며, 데이터 페칭 및 캐싱은 TanStack Query를 활용합니다.
    *   **MUST:** 실시간 업데이트가 필요한 부분(예: "Drop & Blur" 다크룸)에는 Adaptive Polling 전략을 적용합니다.
    *   **이유:** 효율적인 데이터 관리와 최적화된 사용자 경험을 제공합니다.

### 5.3. 상태 관리 컨벤션

*   **로컬 상태:** `useState`, `useReducer`를 사용하여 컴포넌트 내에서만 필요한 상태를 관리합니다.
*   **글로벌/공유 상태:**
    *   **MUST:** 컴포넌트 트리를 따라 내려가며 여러 컴포넌트에서 공유해야 하는 상태는 React Context API 또는 Zustand와 같은 경량 상태 관리 라이브러리를 사용합니다.
    *   **이유:** 불필요한 리렌더링을 줄이고, 상태 관리의 복잡도를 낮춥니다.
*   **서버 상태:**
    *   **MUST:** 서버에서 가져오는 데이터(예: 사용자 정보, 테마 목록, 생성된 이미지 목록)는 TanStack Query를 사용하여 관리합니다.
    *   **이유:** 캐싱, 동기화, 백그라운드 업데이트 등 서버 상태 관리에 필요한 복잡한 로직을 추상화하여 개발 효율성을 높입니다.

### 5.4. API 디자인 표준 (Next.js API Routes)

*   **RESTful 원칙 준수:**
    *   **MUST:** 리소스 기반의 URL (예: `/api/users`, `/api/images/[id]`)을 사용하고, HTTP 메서드(GET, POST, PUT, DELETE)를 리소스에 대한 작업에 맞게 사용합니다.
    *   **이유:** API의 일관성과 예측 가능성을 높여 클라이언트 개발을 용이하게 합니다.
*   **입력 유효성 검사:**
    *   **MUST:** 모든 API 요청의 입력 데이터는 서버 측에서 유효성 검사를 수행합니다. (예: Zod 라이브러리 활용).
    *   **이유:** 잘못된 데이터로 인한 애플리케이션 오류를 방지하고 보안을 강화합니다.
*   **응답 형식:**
    *   **MUST:** 모든 API 응답은 JSON 형식으로 통일하며, 성공/실패 여부와 함께 명확한 메시지를 포함합니다.
    *   **이유:** 클라이언트가 서버 응답을 일관되게 처리할 수 있도록 합니다.
    ```typescript
    // MUST: 일관된 API 응답 형식
    // 성공
    return NextResponse.json({ success: true, data: user }, { status: 200 });
    // 실패
    return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    ```