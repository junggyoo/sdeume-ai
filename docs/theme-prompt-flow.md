# Theme-Prompt-ComfyUI Flow Documentation

테마 선택부터 이미지 생성까지의 전체 데이터 플로우 문서

## 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ThemeSelect UI  →  theme_id (UUID)  →  API 호출                        │
│  (THEME_UI_CONFIGS)    (themes 테이블)    (generation.service)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend (Hono + Supabase)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  1. theme_id → themes.name (slug) 조회                                  │
│  2. Modal API 호출 with themeSlug                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Modal (Python Backend)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  prompts/loader.py  →  prompts/builder.py  →  comfyui_workflow.py       │
│  (YAML 로드)           (프롬프트 조립)         (노드 주입)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ComfyUI                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Node 6 (Main +)  →  Node 7 (Main -)  →  Face/Hand Detailers            │
│  (테마별 프롬프트)    (네거티브)          (LoRA 트리거 주입)               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. 테마 YAML 구조

**위치**: `modal/prompts/themes/*.yaml`

### 2.1 파일 목록

| 파일명 | slug | 한글명 | 설명 |
|--------|------|--------|------|
| `white_studio.yaml` | white_studio | 화이트 스튜디오 | 미니멀 클린 스튜디오 |
| `garden_studio.yaml` | garden_studio | 가든 스튜디오 | 로맨틱 가든 세팅 |
| `classic_studio.yaml` | classic_studio | 클래식 스튜디오 | 그랜드 호텔 볼룸 |

### 2.2 YAML 스키마

```yaml
meta:
  slug: string          # 테마 식별자 (API 파라미터로 사용)
  name_ko: string       # 한글 이름
  name_en: string       # 영문 이름
  description: string   # 테마 설명

main:
  full_body:            # 전신 샷 설정
    camera: string      # 카메라 앵글/구도
    composition: string # 프레임 구성

  closeup:              # 클로즈업 샷 설정
    camera: string
    composition: string

  scene:
    background: string  # 배경 묘사
    atmosphere: string  # 분위기 키워드

  lighting:
    description: string # 조명 스타일

  groom_style:
    attire: string      # 의상
    hair: string        # 헤어스타일
    pose: string        # 포즈

  bride_style:
    attire: string
    hair: string
    accessories: string
    pose: string

  quality:
    technical: string   # 기술적 품질 키워드 (8k, lens 등)

  negative:
    style: string       # 배제할 스타일
    quality: string     # 배제할 품질
    mood: string        # 배제할 분위기

# 얼굴 프롬프트 (배경 키워드 금지!)
groom_face:
  positive:
    core: string        # 신랑 얼굴 프롬프트
  negative:
    core: string

bride_face:
  positive:
    core: string        # 신부 얼굴 프롬프트
  negative:
    core: string

hand:
  positive: string      # 손 디테일 프롬프트
  negative: string

generation:
  cfg: float            # CFG scale (FLUX는 1 권장)
  steps: int            # 샘플링 스텝
  width: int            # 이미지 너비
  height: int           # 이미지 높이

options:
  include_main_triggers: bool  # 메인 프롬프트에 트리거 포함 여부
```

## 3. 프롬프트 빌드 로직

### 3.1 핵심 파일

| 파일 | 역할 |
|------|------|
| `modal/prompts/types.py` | 데이터클래스 정의 |
| `modal/prompts/loader.py` | YAML 파일 로드 + LRU 캐싱 |
| `modal/prompts/builder.py` | 프롬프트 조립 + 워크플로우 적용 |
| `modal/prompts/lint_rules.py` | extra_style_tags 필터링 |

### 3.2 프롬프트 조립 순서 (`build_main_prompt`)

```python
# 1. Shot-specific (full_body 또는 closeup)
parts.append(shot.camera)       # 카메라 앵글
parts.append(shot.composition)  # 구도

# 2. Scene
parts.append(main.scene.background)   # 배경
parts.append(main.scene.atmosphere)   # 분위기

# 3. Lighting
parts.append(main.lighting.description)

# 4. Groom styling
parts.append(groom_style.attire + hair + pose)

# 5. Bride styling
parts.append(bride_style.attire + hair + accessories + pose)

# 6. Quality
parts.append(main.quality.technical)

# 7. Join with ". "
return ". ".join(parts) + "."
```

### 3.3 Negative 프롬프트 조립 (`build_negative_prompt`)

```python
parts = [negative.style, negative.quality, negative.mood]
return ", ".join(parts)
```

## 4. ComfyUI 노드 주입 매핑

### 4.1 `apply_theme_prompts` 함수

총 **8개 노드**에 프롬프트를 주입:

| Node ID | 노드명 | 주입 내용 |
|:-------:|--------|----------|
| **6** | Main Positive | `build_main_prompt()` + extra_style_tags |
| **7** | Main Negative | `build_negative_prompt()` |
| **21** | Groom Face Positive | `{GROOM_TRIGGER}, {groom_face.positive.core}` |
| **26** | Groom Face Negative | `groom_face.negative.core` |
| **23** | Bride Face Positive | `{BRIDE_TRIGGER}, {bride_face.positive.core}` |
| **27** | Bride Face Negative | `bride_face.negative.core` |
| **38** | Hand Positive | `hand.positive` |
| **39** | Hand Negative | `hand.negative` |

### 4.2 LoRA 트리거 주입

얼굴 프롬프트에는 **반드시 트리거 워드**가 앞에 붙음:

```python
# Node 21 (Groom Face)
workflow["21"]["inputs"]["text"] = f"{groom_trigger}, {groom_face_core}"

# Node 23 (Bride Face)
workflow["23"]["inputs"]["text"] = f"{bride_trigger}, {bride_face_core}"
```

기본 트리거: `GROOM_SDME`, `BRIDE_SDME`

### 4.3 Generation Settings 적용

| Node ID | 파라미터 |
|:-------:|----------|
| **5** (EmptyLatentImage) | width, height |
| **3** (KSampler) | cfg, steps, seed |

## 5. 테마별 프롬프트 차이점

### 5.1 White Studio (기본)

| 항목 | 값 |
|------|---|
| 배경 | Clean white horizon, minimal classic molding wall |
| 조명 | Professional softbox, high-key illumination |
| 신랑 의상 | Black tuxedo with black bow tie |
| 신부 의상 | Elegant wedding dress with graceful silhouette |
| 분위기 | Elegant, sophisticated, modern editorial |

### 5.2 Garden Studio

| 항목 | 값 |
|------|---|
| 배경 | Lush green foliage, blooming flowers, vintage trellis |
| 조명 | Golden hour sunlight, warm backlighting, lens flares |
| 신랑 의상 | Light gray three-piece suit with pastel tie |
| 신부 의상 | Flowing romantic gown with lace and tulle |
| 분위기 | Romantic, warm, dreamy, naturally enchanting |

### 5.3 Classic Studio

| 항목 | 값 |
|------|---|
| 배경 | Grand hotel ballroom, crystal chandeliers, marble columns |
| 조명 | Warm ambient chandelier, dramatic shadows, golden highlights |
| 신랑 의상 | Classic black tuxedo with satin lapels |
| 신부 의상 | Stunning ball gown with beading and dramatic train |
| 분위기 | Luxurious, grand, timeless, regally elegant |

### 5.4 Face 프롬프트 비교

| 테마 | Groom Face | Bride Face |
|------|------------|------------|
| White | Soft lighting, gentle smile | Natural bridal makeup, dewy skin |
| Garden | Soft golden lighting, gentle romantic smile | Rosy cheeks, soft pink lips |
| Classic | Warm ambient lighting, confident warm smile | Glamorous makeup, red lips, radiant skin |

## 6. 핵심 파일 맵

```
sdeume-ai/
├── src/
│   ├── features/
│   │   ├── theme/
│   │   │   ├── lib/theme-ui-config.ts    # 프론트엔드 UI 설정
│   │   │   └── hooks/useThemeSelect.ts   # 테마 선택 훅
│   │   └── generation/
│   │       └── types.ts                  # Generation 타입 정의
│   └── backend/
│       └── services/
│           ├── generation.service.ts     # 생성 서비스 (테마 → Modal 호출)
│           └── modal-client.ts           # Modal API 클라이언트
│
└── modal/
    ├── comfyui_workflow.py               # ComfyUI 워크플로우 + 노드 주입
    └── prompts/
        ├── __init__.py                   # 모듈 export
        ├── types.py                      # 데이터클래스 (ThemePromptConfig 등)
        ├── loader.py                     # YAML 로더 + LRU 캐시
        ├── builder.py                    # 프롬프트 빌더 + apply_theme_prompts
        ├── lint_rules.py                 # extra_style_tags 필터링
        └── themes/
            ├── white_studio.yaml
            ├── garden_studio.yaml
            └── classic_studio.yaml
```

## 7. 데이터 플로우 상세

### 7.1 프론트엔드 → 백엔드

```typescript
// 1. ThemeSelect 컴포넌트에서 theme_id 선택
const selectedThemeId = "uuid-from-themes-table";

// 2. generation.service.ts - triggerModalGeneration
const { data: theme } = await supabase
  .from('themes')
  .select('name')  // name = slug (e.g., "white_studio")
  .eq('id', themeId);

// 3. Modal API 호출
generateImages(modalClientConfig, {
  groomLoraUrl,
  brideLoraUrl,
  theme: theme.name,  // slug 전달
  seed,
});
```

### 7.2 백엔드 → Modal

```python
# comfyui_workflow.py - generate 함수
theme_slug = request.get("theme", "white_studio")
shot_type = request.get("shotType", "full_body")

# 프롬프트 시스템으로 워크플로우 변환
workflow = apply_theme_prompts(
    workflow,
    theme_slug=theme_slug,
    shot_type=shot_type,
    groom_trigger=groom_trigger,
    bride_trigger=bride_trigger,
)
```

### 7.3 Modal → ComfyUI

```python
# builder.py - apply_theme_prompts
themes = load_all_themes()  # YAML 캐시 로드
theme = themes.get(theme_slug, themes.get("white_studio"))

# 8개 노드에 프롬프트 주입
workflow["6"]["inputs"]["text"] = main_positive
workflow["7"]["inputs"]["text"] = main_negative
workflow["21"]["inputs"]["text"] = f"{groom_trigger}, {groom_face}"
# ... (총 8개 노드)

# ComfyUI API로 전송
requests.post("http://127.0.0.1:8188/prompt", json={"prompt": workflow})
```

## 8. 확장 가이드

### 8.1 새 테마 추가

1. `modal/prompts/themes/new_theme.yaml` 생성
2. 스키마에 맞춰 모든 섹션 작성
3. `src/features/theme/lib/theme-ui-config.ts`에 UI 설정 추가
4. `themes` 테이블에 레코드 삽입 (name = slug)

### 8.2 프롬프트 수정

1. 해당 테마 YAML 파일 수정
2. Modal 배포 (`modal deploy comfyui_workflow.py`)
3. 캐시 자동 갱신 (서버 재시작 시)

### 8.3 새 노드 추가

1. `WORKFLOW_JSON`에 노드 정의 추가
2. `builder.py`의 `apply_theme_prompts`에 주입 로직 추가
3. 필요시 YAML 스키마 확장 및 `types.py` 수정
