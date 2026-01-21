# 신랑/신부 사진 업로드 플로우

| 항목 | 내용 |
| :--- | :--- |
| **Version** | 1.0 |
| **Last Updated** | 2025-01-21 |
| **Related Files** | `src/features/upload/`, `src/backend/routes/upload.ts` |

---

## 1. 개요

Step 1 페이지에서 사용자가 신랑/신부 사진을 선택하고, "테마 선택하기" 버튼을 눌러 실제 DB에 업로드되기까지의 전체 과정을 설명합니다.

### 핵심 특징

- **클라이언트 사이드 이미지 처리**: HEIC 변환, EXIF 회전, 압축 모두 클라이언트에서 수행
- **실시간 얼굴 분석**: face-api.js를 사용한 얼굴 감지 및 Bucket 분류
- **Bucket D 필터링**: 사용 불가 판정 사진은 서버 업로드 제외

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STEP 1 PAGE (클라이언트)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ 파일 선택                                                               │
│     UploadZone → onFilesSelect(files)                                       │
│                        ↓                                                    │
│  2️⃣ useBulkUpload.addFiles(files)                                          │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │  a) uploadStore.addToQueueAsync() - 큐에 파일 추가           │         │
│     │  b) 각 파일에 대해 processFile() 호출                        │         │
│     │     ┌────────────────────────────────────────────────────┐  │         │
│     │     │  ① image-processor.processImage()                 │  │         │
│     │     │     - HEIC → JPEG 변환 (convertHeicToJpeg)        │  │         │
│     │     │     - EXIF 회전 Baking (normalizeImageOrientation) │  │         │
│     │     │     - 이미지 압축 (browser-image-compression)      │  │         │
│     │     │                                                    │  │         │
│     │     │  ② face-mesh.analyzeFaceFromFile()                │  │         │
│     │     │     - face-api.js로 얼굴 감지                      │  │         │
│     │     │     - yaw 각도, 미소 점수, 눈 뜸 여부 분석          │  │         │
│     │     │     - Bucket 분류 (A/B/C/D)                       │  │         │
│     │     └────────────────────────────────────────────────────┘  │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                        ↓                                                    │
│  3️⃣ PhotoGrid에 처리된 사진 표시                                            │
│     - status: pending → analyzing → completed                               │
│     - 각 사진에 Bucket 타입 표시 (A/B/C/D)                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  4️⃣ "테마 선택하기" 버튼 클릭 → handleNext()                                │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │  a) createProjectMutation - 프로젝트 생성 (POST /api/projects)│         │
│     │                                                             │         │
│     │  b) Promise.all([                                           │         │
│     │       groomStorage.syncUploadsToServer('groom'),            │         │
│     │       brideStorage.syncUploadsToServer('bride')             │         │
│     │     ])                                                      │         │
│     │     - Bucket D 사진은 제외 (사용 불가 사진)                   │         │
│     │     - 각 사진을 FormData로 백엔드 전송                       │         │
│     │                                                             │         │
│     │  c) router.push(`/new-shoot/${projectId}/step2`)           │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           백엔드 (POST /api/upload)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5️⃣ uploadRoutes POST '/'                                                  │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │  a) 인증 확인 (Authorization header → getAuthUser)          │         │
│     │                                                             │         │
│     │  b) FormData 파싱                                           │         │
│     │     - file: 이미지 파일 (이미 JPEG로 변환됨)                  │         │
│     │     - metadata: { projectId, role, bucketType, ... }        │         │
│     │                                                             │         │
│     │  c) uploadImageToStorage()                                  │         │
│     │     - Supabase Storage에 업로드                              │         │
│     │     - 경로: uploads/{projectId}/{role}/{uuid}.{ext}         │         │
│     │     - public URL 반환                                        │         │
│     │                                                             │         │
│     │  d) createUploadRecord()                                    │         │
│     │     - 프로젝트 소유권 확인                                    │         │
│     │     - uploads 테이블에 레코드 삽입                            │         │
│     │       { project_id, user_id, role, original_url,            │         │
│     │         bucket_type, face_yaw, smile_score, ... }           │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 파일 및 역할

| 파일 | 역할 |
|------|------|
| `src/app/(shoot)/new-shoot/step1/page.tsx` | Step1 페이지 - 전체 업로드 플로우 오케스트레이션 |
| `src/features/upload/hooks/useBulkUpload.ts` | 파일 처리 훅 - 이미지 압축 + 얼굴 분석 |
| `src/features/upload/hooks/useUploadToStorage.ts` | 서버 업로드 훅 - Supabase Storage 전송 |
| `src/features/upload/store/upload-store.ts` | Zustand 스토어 - 업로드 큐 상태 관리 |
| `src/features/upload/lib/image-processor.ts` | 이미지 처리 - HEIC 변환, EXIF 회전, 압축 |
| `src/features/upload/lib/face-mesh.ts` | 얼굴 분석 - face-api.js 기반 얼굴 감지 |
| `src/backend/routes/upload.ts` | 백엔드 API - Supabase 저장 및 DB 기록 |

---

## 4. 단계별 상세 설명

### 4.1 파일 선택 (UploadZone)

```typescript
// src/app/(shoot)/new-shoot/step1/page.tsx
<UploadZone
  onFilesSelect={(files) => currentUpload.addFiles(files)}
  photoCount={activeRole === 'groom' ? groomCount : brideCount}
  maxPhotos={RECOMMENDED_PHOTOS_PER_ROLE}
  role={activeRole}
/>
```

사용자가 파일을 선택하면 `onFilesSelect` 콜백을 통해 `useBulkUpload.addFiles()`가 호출됩니다.

### 4.2 파일 처리 (useBulkUpload)

```typescript
// src/features/upload/hooks/useBulkUpload.ts:127-154
const addFiles = async (files: FileList | File[]) => {
  // 1) 스토어 큐에 파일 추가
  const newItems = await addToQueueAsync(fileArray, role);

  // 2) 각 파일 순차 처리 (UI 반응성 유지)
  for (const item of newItems) {
    await processFile(item);  // 압축 + 얼굴 분석
    await yieldToMain();      // UI 업데이트 허용
  }
};
```

### 4.3 이미지 처리 (processImage)

```typescript
// src/features/upload/lib/image-processor.ts:182-214
export async function processImage(file: File, options = {}) {
  // 1) HEIC → JPEG 변환
  const jpegFile = await convertHeicToJpeg(file);

  // 2) EXIF 회전 Baking (브라우저 자동 회전을 픽셀에 적용)
  const normalizedFile = await normalizeImageOrientation(jpegFile);

  // 3) 이미지 압축 (browser-image-compression)
  const compressedFile = await imageCompression(normalizedFile, {
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: opts.convertToWebP ? 'image/webp' : undefined,
    initialQuality: 0.8,
  });

  return { file: compressedFile, previewUrl, width, height };
}
```

#### HEIC 변환 (`convertHeicToJpeg`)

아이폰에서 AirDrop으로 전송된 HEIC 파일을 JPEG로 변환합니다.

```typescript
// src/features/upload/lib/image-processor.ts:45-110
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  // heic-decode 라이브러리로 디코딩
  const decode = (await import('heic-decode')).default;
  const arrayBuffer = await file.arrayBuffer();
  const decoded = await decode({ buffer: arrayBuffer });

  // Canvas에 그려서 JPEG로 변환
  const canvas = document.createElement('canvas');
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(decoded.width, decoded.height);
  imageData.data.set(new Uint8ClampedArray(decoded.data));
  ctx.putImageData(imageData, 0, 0);

  // JPEG Blob 생성
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
  });

  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
    type: 'image/jpeg'
  });
}
```

#### EXIF 회전 Baking (`normalizeImageOrientation`)

아이폰 세로 촬영 사진의 EXIF Orientation을 픽셀에 "Baking"합니다.

```typescript
// src/features/upload/lib/image-processor.ts:126-177
export async function normalizeImageOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 브라우저가 이미 EXIF 회전을 적용한 상태로 렌더링
      canvas.width = img.width;
      canvas.height = img.height;

      // 단순히 Canvas에 그리면 회전이 픽셀에 적용됨
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        }));
      }, file.type, 0.95);
    };

    img.src = url;
  });
}
```

> **핵심 원리**: 모던 브라우저(Chrome, Safari, Firefox)는 `new Image()`로 이미지를 로드할 때 EXIF Orientation을 자동으로 적용합니다. 따라서 별도의 수동 회전 로직 없이 Canvas에 그리기만 하면 회전이 픽셀에 "Baking"됩니다.

### 4.4 얼굴 분석 (analyzeFaceFromFile)

```typescript
// src/features/upload/lib/face-mesh.ts:315-361
export async function analyzeFaceFromFile(file: File): Promise<FaceAnalysisResult> {
  // face-api.js 모델로 얼굴 분석
  const result = await analyzeFace(img);

  return {
    faceDetected: true,
    yawAngle,        // -90 ~ 90 (좌우 회전 각도)
    smileScore,      // 0.0 ~ 1.0 (미소 점수)
    eyesOpen,        // 눈 뜸 여부
    bucket,          // A/B/C/D 분류
    confidence,      // 감지 신뢰도
    faceBox,         // 얼굴 영역 좌표
    ...
  };
}
```

### 4.5 Bucket 분류 기준

| Bucket | 조건 | 용도 |
|--------|------|------|
| **A** | \|yaw\| ≤ 12° | 정면 - 신원 학습 |
| **B** | 12° < \|yaw\| < 65° | 반측면 - 구조 학습 |
| **C** | happy ≥ 0.7 | 스마일 - 바이브 샷 |
| **D** | 얼굴 미감지, 극단 각도 ≥70°, 다중 얼굴 등 | 제외 |

```typescript
// src/features/upload/types.ts:81-96
export const BUCKET_THRESHOLDS = {
  FRONTAL_MAX_YAW: 12,      // Bucket A 최대 각도
  SIDE_MAX_YAW: 65,         // Bucket B 최대 각도
  EXTREME_YAW: 70,          // 이 이상은 Bucket D
  MIN_HAPPY_SCORE: 0.7,     // Bucket C 최소 미소 점수
  MIN_EYE_ASPECT_RATIO: 0.1,// 눈 뜸 판정 임계값
  MIN_IMAGE_SIZE: 512,      // 최소 이미지 크기
} as const;
```

### 4.6 서버 업로드 ("테마 선택하기" 버튼)

```typescript
// src/app/(shoot)/new-shoot/step1/page.tsx:111-142
const handleNext = async () => {
  // 1) 프로젝트 생성
  const project = await createProjectMutation.mutateAsync();

  // 2) 신랑/신부 사진 병렬 업로드
  const [groomUploads, brideUploads] = await Promise.all([
    groomStorage.syncUploadsToServer('groom', { projectIdOverride: project.id }),
    brideStorage.syncUploadsToServer('bride', { projectIdOverride: project.id }),
  ]);

  // 3) Step2로 이동
  router.push(`/new-shoot/${project.id}/step2`);
};
```

#### Bucket D 필터링

```typescript
// src/features/upload/hooks/useUploadToStorage.ts:127-131
const completedItems = queue.filter(
  (item) =>
    item.status === 'completed' &&
    item.analysis &&
    item.analysis.bucket !== 'D' // Bucket D는 업로드 제외
);
```

### 4.7 백엔드 처리 (POST /api/upload)

```typescript
// src/backend/routes/upload.ts:264-326
.post('/', async (c) => {
  // 1) 인증 확인
  const { user } = await getAuthUser(c, supabase);

  // 2) FormData 파싱
  const file = formData.get('file');  // 이미 JPEG로 변환됨
  const metadata = formData.get('metadata');

  // 3) Supabase Storage 업로드
  const publicUrl = await uploadImageToStorage(
    supabase, user.id, projectId, role, file
  );
  // 경로: uploads/{projectId}/{groom|bride}/{uuid}.jpg

  // 4) DB 레코드 생성
  await supabase.from('uploads').insert({
    project_id, user_id, role, original_url,
    bucket_type, face_yaw, smile_score, quality_score,
    is_selected: true, crop_mode: 'original'
  });
});
```

---

## 5. 핵심 포인트

### 5.1 HEIC 처리는 클라이언트에서 완료

- 백엔드는 이미 JPEG로 변환된 파일만 수신
- `convertHeicToJpeg`에서 `heic-decode` 라이브러리 사용
- 브라우저가 HEIC를 직접 표시할 수 없으므로 변환 필수

### 5.2 EXIF 회전도 클라이언트에서 처리

- `normalizeImageOrientation`에서 브라우저 자동 회전을 픽셀에 "Baking"
- 백엔드와 AI 서비스(fal.ai)에서 회전 문제 발생하지 않음
- 수동 회전 로직 불필요 - 브라우저 렌더링을 신뢰

### 5.3 얼굴 분석 결과를 메타데이터로 전송

- `bucketType`, `faceYaw`, `smileScore`, `qualityScore` 전달
- DB에 저장되어 나중에 AI 학습 시 참조
- 테마 추천 로직에서도 활용

### 5.4 Bucket D 사진은 업로드 제외

- 사용 불가 판정 받은 사진은 서버로 전송하지 않음
- 대역폭 및 스토리지 비용 절감
- LoRA 학습 품질 보장

---

## 6. 업로드 상태 흐름

```
pending → analyzing → completed → uploading → synced
                    ↘ error
```

| 상태 | 설명 |
|------|------|
| `pending` | 큐에 추가됨, 처리 대기 중 |
| `analyzing` | 이미지 압축 및 얼굴 분석 중 |
| `completed` | 분석 완료, 서버 업로드 대기 |
| `uploading` | 서버로 업로드 중 |
| `synced` | 서버 업로드 완료 |
| `error` | 처리 또는 업로드 실패 |

---

## 7. 타입 정의

```typescript
// src/features/upload/types.ts

export type UploadRole = 'groom' | 'bride';
export type BucketType = 'A' | 'B' | 'C' | 'D';

export interface QueuedFile {
  id: string;
  file: File;
  role: UploadRole;
  status: 'pending' | 'analyzing' | 'uploading' | 'completed' | 'synced' | 'error';
  progress: number;
  analysis?: FaceAnalysisResult;
  error?: string;
  previewUrl?: string;
}

export interface FaceAnalysisResult {
  faceDetected: boolean;
  yawAngle: number;      // -90 to 90
  smileScore: number;    // 0.0 to 1.0
  eyesOpen: boolean;
  bucket: BucketType;
  confidence: number;
  qualityIssues: QualityIssue[];
  isUsable: boolean;
  rejectionReason?: string;
  faceBox?: { x: number; y: number; width: number; height: number };
  imageWidth?: number;
  imageHeight?: number;
}
```

---

## 8. 디버그 도구

EXIF 회전 및 HEIC 변환을 테스트할 수 있는 디버그 페이지가 있습니다.

- **URL**: `/test/image-debug`
- **파일**: `src/app/test/image-debug/page.tsx`

### 기능

1. 이미지 선택 (HEIC 포함)
2. EXIF Orientation 값 표시
3. Before/After 비교 (원본 vs 처리됨)
4. 처리된 이미지 다운로드
5. 파일 크기 및 해상도 비교

---

## 9. 관련 문서

- [architecture.md](./architecture.md) - 전체 시스템 아키텍처
- [face-training-flow.md](./face-training-flow.md) - LoRA 학습 플로우
