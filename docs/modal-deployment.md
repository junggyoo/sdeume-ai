# Modal 배포 가이드

## 개요

이 프로젝트는 [Modal](https://modal.com)을 사용하여 ComfyUI 기반 이미지 생성 서버를 GPU 환경에서 실행합니다.

---

## 배포 명령어

### 기본 배포

```bash
pnpm modal:deploy
```

### 사용 가능한 스크립트

| 명령어 | 설명 |
|-------|------|
| `pnpm modal:setup` | Modal CLI 및 Python venv 초기 설정 |
| `pnpm modal:deploy` | Modal 서버 배포 |
| `pnpm modal:validate` | Python 문법 검증만 (배포 없이) |
| `pnpm modal:models:list` | 설치된 모델 목록 확인 |
| `pnpm modal:models:download` | 필요한 모델 다운로드 |

---

## 프로젝트 구조

```
modal/
├── comfyui_workflow.py    # 메인 Modal 앱 (배포 대상)
├── prompts/               # 테마별 프롬프트 YAML 파일
│   ├── loader.py          # 프롬프트 로더
│   ├── __init__.py
│   └── themes/            # 테마 정의 파일들
├── config.py              # 설정
├── download_models.py     # 모델 다운로드 스크립트
├── requirements.txt       # Python 의존성
└── .venv/                 # Python 가상환경 (modal:setup으로 생성)
```

---

## 배포 최적화

### 런타임 마운트 vs 이미지 빌드

Modal의 `add_local_dir`은 두 가지 모드로 동작합니다:

| 모드 | 설정 | 동작 | 배포 시간 |
|-----|------|-----|----------|
| **런타임 마운트** | `copy=False` (기본값) | 컨테이너 시작 시 파일 주입 | 빠름 (~5초) |
| **이미지 빌드** | `copy=True` | 이미지에 파일 복사 | 느림 (수 분) |

### 현재 설정

```python
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(...)
    .pip_install(...)
    .run_commands(...)  # ComfyUI, Impact Pack 등 무거운 설치
    # 프롬프트는 마지막에 런타임 마운트로 추가
    .add_local_dir("modal/prompts", "/app/prompts")  # copy=False (기본값)
)
```

### 배포 시간 비교

| 변경 내용 | 예상 배포 시간 |
|----------|--------------|
| 프롬프트만 수정 (`modal/prompts/`) | ~5초 |
| Python 로직 수정 (`comfyui_workflow.py`) | ~10초 |
| pip_install 변경 | 수 분 |
| run_commands 변경 | 수 분 |

---

## 초기 설정

### 1. Modal 계정 설정

```bash
pnpm modal:setup
```

이 명령어는:
- Python 가상환경 생성 (`modal/.venv`)
- Modal CLI 설치
- Modal 인증 (브라우저에서 로그인)

### 2. 모델 다운로드

```bash
pnpm modal:models:download
```

필요한 모델:
- `flux1-dev-fp8.safetensors` (체크포인트)
- `Flux-Realism.safetensors` (LoRA)
- `face_yolov8m.pt`, `hand_yolov8s.pt` (Ultralytics)

---

## 트러블슈팅

### Modal CLI를 찾을 수 없음

```
Error: Modal CLI not found. Run 'pnpm modal:setup' first.
```

**해결:** `pnpm modal:setup` 실행

### 프롬프트 디렉토리를 찾을 수 없음

```
Error: local dir modal/prompts does not exist
```

**해결:** 프로젝트 루트에서 명령어 실행 확인

### 이미지 빌드가 너무 오래 걸림

프롬프트만 수정했는데 이미지가 리빌드되는 경우:
- `add_local_dir`에 `copy=True`가 설정되어 있지 않은지 확인
- `add_local_dir`이 무거운 `run_commands` 이후에 위치하는지 확인

---

## 배포 엔드포인트

배포 완료 후 엔드포인트:

```
https://[workspace]--sdeume-ai-comfyui-comfyuiserver-generate.modal.run
```

### API 예시

```bash
curl -X POST https://[endpoint] \
  -H "Content-Type: application/json" \
  -d '{
    "groomLoraUrl": "https://...",
    "brideLoraUrl": "https://...",
    "theme": "white_studio",
    "shotType": "full_body",
    "width": 896,
    "height": 1152
  }'
```

---

## 참고 자료

- [Modal 공식 문서](https://modal.com/docs)
- [Modal 1.0 마이그레이션 가이드](https://modal.com/docs/guide/modal-1-0-migration)
- [modal.Image 레퍼런스](https://modal.com/docs/reference/modal.Image)
