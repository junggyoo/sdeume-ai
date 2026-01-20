# Step1 사진 업로드 및 fal.ai 얼굴 학습 플로우

이 문서는 신랑/신부 사진 업로드부터 fal.ai LoRA 얼굴 학습까지의 전체 플로우를 설명합니다.

---

## 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Step1 페이지 (Client)                        │
│  src/app/(shoot)/new-shoot/step1/page.tsx                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. 이미지 선택 → 압축 → 얼굴 분석 → 버킷 분류 → 큐 저장            │
│  2. "다음" 클릭 → 프로젝트 생성 → Supabase Storage 업로드           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend API (Hono)                          │
├─────────────────────────────────────────────────────────────────────┤
│  POST /api/upload     → uploads 테이블 + Storage 저장               │
│  POST /api/generate   → LoRA 학습 시작                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         fal.ai (외부 서비스)                         │
├─────────────────────────────────────────────────────────────────────┤
│  flux-lora-portrait-trainer 모델로 LoRA 학습                        │
│  완료 시 → POST /api/generate/webhooks/fal 콜백                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. 클라이언트 사이드 처리 (Step1 페이지)

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/(shoot)/new-shoot/step1/page.tsx` | 메인 페이지 |
| `src/features/upload/hooks/useBulkUpload.ts` | 이미지 처리 훅 |
| `src/features/upload/lib/face-mesh.ts` | 얼굴 분석 (face-api.js) |
| `src/features/upload/lib/bucket-classifier.ts` | A/B/C/D 버킷 분류 |
| `src/features/upload/store/upload-store.ts` | Zustand 상태 관리 |

### 처리 플로우

```
이미지 선택 (drag-drop)
    │
    ▼
이미지 압축 (browser-image-compression)
  - 최대 2048x2048, 품질 0.8, WebP 변환
    │
    ▼
얼굴 분석 (face-api.js in browser)
  - SSD Mobilenet v1으로 얼굴 탐지
  - 68 포인트 랜드마크 추출
  - Yaw 각도 계산 (좌우 회전)
  - 표정 분석 (happy score)
    │
    ▼
버킷 분류 (Waterfall Logic)
  - D (거부): 얼굴 미감지 또는 |yaw| >= 70°
  - C (스마일): happyScore >= 0.7
  - A (정면): |yaw| <= 12°
  - B (측면): 12° < |yaw| < 70°
    │
    ▼
Upload Store 큐에 저장 (groomQueue / brideQueue)
```

### 버킷 분류 기준

| 버킷 | 조건 | 목표 수량 | 용도 |
|------|------|----------|------|
| A (정면) | Yaw ≤ 12° | 8-10장 | LoRA 학습 핵심 이미지 |
| B (측면) | 12° < Yaw < 70° | 6-8장 | 다양한 각도 학습 |
| C (스마일) | Happy Score ≥ 0.7 | 무제한 | 표정 다양성 |
| D (거부) | 얼굴 없음 또는 극단적 각도 | 0장 | 학습에서 제외 |

### 얼굴 분석 상세

#### Yaw 각도 계산 (좌우 회전)
- 코 끝점(30)과 양쪽 눈 외각(36, 45) 사용
- 범위: -90° ~ 90° (음수: 좌향, 양수: 우향)

#### Eye Aspect Ratio (EAR)
- 눈뜬 정도 판별 (68 랜드마크 사용)
- 임계값: 0.1 (아시안 눈 모양, 측면각 고려)

#### 복수 얼굴 감지
- 2개 이상의 유의미한 얼굴 → Bucket D (거부)
- 이유: LoRA 학습은 단일 개인용

---

## 2. 서버 사이드 저장 (업로드 API)

### 엔드포인트: `POST /api/upload`

**파일**: `src/backend/routes/upload.ts`

### 처리 단계

1. FormData 파싱 (file + metadata)
2. Supabase Storage 업로드
   - 경로: `uploads/{projectId}/{role}/{randomId}.{ext}`
3. 업로드 레코드 DB 저장

### 업로드 레코드 구조

```typescript
interface UploadRecord {
  id: string;
  projectId: string;
  userId: string;
  role: 'groom' | 'bride';
  originalUrl: string;           // Supabase Storage 공개 URL
  croppedUrl: string | null;     // 향후 지원
  bucketType: 'A' | 'B' | 'C' | 'D' | null;
  faceYaw: number | null;
  smileScore: number | null;
  qualityScore: number | null;
  isSelected: boolean;
  cropMode: 'original' | 'face' | 'body';
  cropRect: { x: number; y: number; width: number; height: number } | null;
  createdAt: string;
}
```

---

## 3. fal.ai LoRA 학습 플로우

### 학습 시작 트리거

테마 선택(Step3) 완료 후 "생성 시작" 클릭 시 실행

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/backend/services/generation.service.ts` | 생성 오케스트레이션 |
| `src/backend/services/fal-client.ts` | fal.ai API 클라이언트 |
| `src/backend/services/storage.service.ts` | ZIP 파일 생성 |
| `src/backend/services/lora-model.service.ts` | LoRA 모델 관리 |

### 학습 시작 프로세스

```typescript
// generation.service.ts - startLoraTrainingForGeneration()

// 1. ZIP 파일 생성 (병렬 처리)
const [groomZipUrl, brideZipUrl] = await Promise.all([
  createTrainingZip(projectId, 'groom'),  // D 버킷 제외
  createTrainingZip(projectId, 'bride')
]);

// 2. fal.ai 학습 시작 (병렬 처리)
const [groomResult, brideResult] = await Promise.all([
  startLoraTraining(groomZipUrl, 'groom'),
  startLoraTraining(brideZipUrl, 'bride')
]);

// 3. lora_models 테이블에 레코드 생성
// status: 'training', fal_job_id 저장
```

### fal.ai 요청 구조

```typescript
interface FalTrainingRequest {
  images_data_url: string;           // ZIP 파일 URL
  trigger_word: 'GROOM_SDME' | 'BRIDE_SDME';
  is_style: false;
  steps: 1000;
  create_masks: true;
  webhook_url: string;               // 완료 콜백 URL
}

interface FalTrainingResponse {
  request_id: string;                // fal.ai 작업 ID
}
```

### ZIP 파일 생성

**함수**: `createTrainingZip()` in `src/backend/services/storage.service.ts`

1. 프로젝트에서 모든 업로드 이미지 조회
2. D bucket (거부) 제외
3. ZIP 파일로 압축
4. Supabase Storage에 업로드
5. URL 반환

**ZIP 경로**: `training-images/{projectId}/{role}/images.zip`

---

## 4. Webhook 처리 (학습 완료)

### 엔드포인트: `POST /api/generate/webhooks/fal`

**파일**: `src/backend/routes/generation.ts`

### 처리 플로우

```
fal.ai 완료 콜백
    │
    ▼
HMAC-SHA256 서명 검증 (X-Fal-Signature 헤더)
    │
    ▼
request_id로 lora_models 레코드 찾기
    │
    ▼
상태 업데이트
  - status: 'completed'
  - model_url: 다운로드 URL 저장
  - completed_at: 타임스탬프
    │
    ▼
user_face_models 업서트
  - 기존 활성 모델 비활성화 (same role)
  - 새 모델 생성 (isActive=true)
    │
    ▼
신랑/신부 모두 완료 확인
    │
    ├─ Yes → training_completed_at 저장
    │        → Modal 이미지 생성 트리거 (비동기)
    │
    └─ No  → 대기
```

### 서명 검증

```typescript
// HMAC-SHA256 서명 검증
const signature = request.headers.get('X-Fal-Signature');
const expectedSignature = crypto
  .createHmac('sha256', FAL_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

// timing-safe-equal로 비교
```

---

## 5. DB 테이블 관계

```
projects
    │
    ├── uploads (Step1 사진)
    │   └── bucketType, faceYaw, smileScore 등 메타데이터
    │
    ├── generations (생성 작업)
    │   ├── groom_lora_model_id (FK → lora_models)
    │   └── bride_lora_model_id (FK → lora_models)
    │
    └── lora_models (LoRA 모델)
        ├── fal_job_id (fal.ai request_id)
        ├── model_url (학습 완료된 모델 URL)
        └── status: pending | training | completed | failed

user_face_models (사용자별 활성 모델)
    ├── role: 'groom' | 'bride'
    ├── lora_model_id (FK → lora_models)
    └── is_active: boolean
```

### lora_models 테이블 구조

```typescript
interface LoraModel {
  id: string;
  projectId: string;
  userId: string;
  role: 'bride' | 'groom';
  falJobId: string | null;        // fal.ai request_id
  modelUrl: string | null;        // 완료된 모델 URL
  status: 'pending' | 'training' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}
```

### user_face_models 테이블 구조

```typescript
interface UserFaceModel {
  id: string;
  userId: string;
  role: 'bride' | 'groom';
  loraModelId: string | null;    // FK to lora_models
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  loraModel?: {                   // JOIN된 데이터
    id: string;
    modelUrl: string | null;
    status: 'pending' | 'training' | 'completed' | 'failed';
    completedAt: string | null;
  };
}
```

---

## 6. 전체 플로우 (End-to-End)

### Phase 1: 사진 업로드 (Step1)

```
사용자 선택
    ↓
이미지 추가 (drag-drop)
    ↓
이미지 압축 (browser-image-compression)
    ↓
얼굴 탐지 & 분석 (face-api.js in browser)
    ↓
버킷 분류 (A/B/C/D)
    ↓
Upload Store에 큐 저장
    ↓
UI 표시 (PhotoGrid + Progress)
    ↓
사용자가 "다음" 클릭
    ↓
프로젝트 생성 (POST /api/projects)
    ↓
모든 이미지 서버 업로드
    ↓
uploads 테이블에 메타데이터 저장
    ↓
Step2로 이동
```

### Phase 2: 사진 분류 최적화 (Step2-3)

```
사진 갤러리 표시
    ↓
버킷별 분류 확인
    ↓
선택적: 사진 편집/재분류
    ↓
테마 선택 (Step3)
    ↓
"얼굴 학습 시작" 클릭
```

### Phase 3: 얼굴 학습 (Backend)

```
생성 레코드 생성 (status='queued' → 'training')
    ↓
기존 모델 확인 (스마트 네비게이션)
    ├─ 있음 → 학습 건너뛰고 생성만 진행
    └─ 없음 → 학습 진행
    ↓
ZIP 생성 (각 역할별):
  - uploads 테이블에서 이미지 필터링
  - D bucket 제외
  - 압축 후 Storage 업로드
    ↓
fal.ai 학습 시작 (병렬):
  - groom ZIP → fal-ai/flux-lora-portrait-trainer
  - bride ZIP → fal-ai/flux-lora-portrait-trainer
    ↓
반환된 request_id로 lora_models 레코드 생성
  (status='training', fal_job_id=request_id)
    ↓
generation 업데이트:
  - groom_lora_model_id, bride_lora_model_id FK 저장
  - status='training'
```

### Phase 4: Webhook (완료)

```
fal.ai → POST /api/generate/webhooks/fal
    ↓
서명 검증 (HMAC-SHA256)
    ↓
request_id로 lora_models 찾기
    ↓
model_url 저장 + 상태='completed'
    ↓
user_face_models에 업서트
  (기존 비활성화 + 새 모델 활성화)
    ↓
generation의 lora_url 확인
    ↓
신랑/신부 모두 완료?
  ├─ 예 → training_completed_at 저장
  │     → Modal 이미지 생성 트리거
  └─ 아니오 → 대기
    ↓
Modal API 호출 (비동기)
    ↓
이미지 생성 + 저장
    ↓
generation 상태='completed'
```

---

## 7. 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/upload` | 이미지 업로드 + 메타데이터 저장 |
| `GET` | `/api/upload/project/:projectId` | 프로젝트 이미지 조회 |
| `DELETE` | `/api/upload/:uploadId` | 이미지 삭제 |
| `POST` | `/api/projects` | 프로젝트 생성 |
| `POST` | `/api/generate` | LoRA 학습 + 이미지 생성 시작 |
| `POST` | `/api/generate/webhooks/fal` | fal.ai 완료 콜백 |
| `GET` | `/api/generate/:generationId` | 생성 상태 조회 |
| `POST` | `/api/user-face-models` | 사용자 얼굴 모델 업서트 |
| `GET` | `/api/user-face-models` | 활성 얼굴 모델 조회 |
| `GET` | `/api/user-face-models/status` | 얼굴 데이터 상태 |

---

## 8. 기술 스택

| 영역 | 기술 |
|------|------|
| 얼굴 감지 | face-api.js (SSD Mobilenet v1) - 브라우저 실행 |
| 이미지 압축 | browser-image-compression |
| 상태 관리 | Zustand |
| 서버 프레임워크 | Hono (Next.js API Routes) |
| DB & 스토리지 | Supabase (PostgreSQL + Storage) |
| API 클라이언트 | Fetch API |
| 보안 | HMAC-SHA256 (webhook 서명 검증) |
| LoRA 학습 | fal.ai (flux-lora-portrait-trainer) |
| 이미지 생성 | Modal API |

---

## 9. 파일 경로 참조

### 프론트엔드

| 파일 | 용도 |
|------|------|
| `src/app/(shoot)/new-shoot/step1/page.tsx` | Step1 페이지 |
| `src/features/upload/hooks/useBulkUpload.ts` | 이미지 처리 훅 |
| `src/features/upload/hooks/useUploadToStorage.ts` | 스토리지 업로드 훅 |
| `src/features/upload/store/upload-store.ts` | 상태 관리 |
| `src/features/upload/lib/face-mesh.ts` | 얼굴 분석 |
| `src/features/upload/lib/bucket-classifier.ts` | 버킷 분류 |
| `src/features/upload/lib/image-processor.ts` | 이미지 처리 |
| `src/features/face/hooks/useUserFaceModels.ts` | 사용자 모델 쿼리 |
| `src/features/face/types.ts` | 얼굴 모델 타입 |

### 백엔드

| 파일 | 용도 |
|------|------|
| `src/backend/services/fal-client.ts` | fal.ai 클라이언트 |
| `src/backend/services/generation.service.ts` | 생성 로직 |
| `src/backend/services/lora-model.service.ts` | LoRA 모델 관리 |
| `src/backend/services/user-face-model.service.ts` | 사용자 모델 관리 |
| `src/backend/services/storage.service.ts` | ZIP 생성 및 스토리지 |
| `src/backend/routes/upload.ts` | 업로드 API |
| `src/backend/routes/generation.ts` | 생성 API + 웹훅 |
| `src/backend/routes/user-face-model.ts` | 모델 API |
