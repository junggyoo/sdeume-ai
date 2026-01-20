# Webhook 아키텍처 및 로컬 개발 환경 설정

이 문서는 fal.ai 학습 과정에서 webhook이 왜 필요한지, 로컬 개발 환경에서 ngrok이 필요한 이유, 그리고 `NEXT_PUBLIC_APP_URL` 환경 변수의 역할을 설명합니다.

---

## 1. Webhook이 필요한 이유

### LoRA 학습의 특성

fal.ai LoRA 학습은 **오래 걸리는 작업**입니다 (수 분 ~ 수십 분).

```
┌─────────────┐                      ┌─────────────┐
│   우리 서버  │ ──── 학습 요청 ────▶ │   fal.ai    │
│             │                      │             │
│  (기다림?)   │                      │  (학습 중)   │
│             │                      │  5~15분...  │
└─────────────┘                      └─────────────┘
```

이렇게 오래 걸리는 작업을 처리하는 방식은 두 가지가 있습니다.

### 방식 A: 동기식 (Polling)

```
우리 서버: "학습 시작해줘"
fal.ai: "알겠어, request_id는 abc123이야"
우리 서버: "끝났어?" → "아직"
우리 서버: "끝났어?" → "아직"
우리 서버: "끝났어?" → "아직"
... (5분간 반복)
우리 서버: "끝났어?" → "완료! 결과 여기있어"
```

**단점**:
- 서버가 계속 상태를 물어봐야 함 (리소스 낭비)
- HTTP 연결 유지 문제
- 서버리스 환경(Vercel)에서 타임아웃 발생 가능

### 방식 B: 비동기식 (Webhook) ← 현재 구현

```
우리 서버: "학습 시작해줘. 끝나면 이 URL로 알려줘"
fal.ai: "알겠어, request_id는 abc123이야"
우리 서버: (다른 일 처리... 또는 대기)

... 5분 후 ...

fal.ai: "끝났어!" ──▶ POST /api/generate/webhooks/fal
우리 서버: "오 결과 받았다, DB 업데이트하자"
```

**장점**:
- 효율적 (기다릴 필요 없음)
- fal.ai가 완료되면 **우리 서버로 직접 알려줌**
- 서버리스 환경에 적합

---

## 2. Webhook 동작 원리

### 학습 시작 시점

```
우리 서버 (Vercel/로컬)                         fal.ai
        │                                         │
        │  POST /fal-ai/flux-lora-portrait-trainer
        │  {                                      │
        │    images_data_url: "...",              │
        │    trigger_word: "GROOM_SDME",          │
        │    webhook_url: "https://우리서버/api/..." ◀── 콜백 URL
        │  }                                      │
        │ ──────────────────────────────────────▶ │
        │                                         │
        │  { request_id: "abc123" }               │
        │ ◀────────────────────────────────────── │
        │                                         │
```

### 학습 완료 시점 (5~15분 후)

```
우리 서버                                       fal.ai
        │                                         │
        │  POST https://우리서버/api/generate/webhooks/fal
        │  {                                      │
        │    request_id: "abc123",                │
        │    status: "COMPLETED",                 │
        │    payload: { model_url: "..." }        │
        │  }                                      │
        │ ◀────────────────────────────────────── │
        │                                         │
    DB 업데이트                                    │
    이미지 생성 트리거                              │
```

**핵심**: fal.ai가 우리 서버로 HTTP 요청을 보내야 합니다!

---

## 3. 로컬 개발 환경에서 ngrok이 필요한 이유

### 문제 상황

```
로컬 개발 환경:
  - 우리 서버: http://localhost:3000
  - webhook_url: http://localhost:3000/api/generate/webhooks/fal

fal.ai 서버 (외부 인터넷):
  - "localhost:3000으로 요청 보내야지..."
  - "어? localhost는 내 컴퓨터인데? 연결 불가!"
```

`localhost`는 **자기 자신의 컴퓨터**를 의미합니다:
- 당신의 컴퓨터에서 `localhost` = 당신의 컴퓨터
- fal.ai 서버에서 `localhost` = fal.ai 서버 자신

**fal.ai는 당신의 로컬 컴퓨터에 접근할 방법이 없습니다!**

### ngrok의 역할

ngrok은 **터널**을 만들어서 외부 인터넷에서 로컬 서버에 접근할 수 있게 해줍니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  인터넷                                                          │
│                                                                  │
│   fal.ai ────▶ https://abc123.ngrok.io ────┐                    │
│                                             │                    │
└─────────────────────────────────────────────│────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  당신의 컴퓨터                                                    │
│                                                                  │
│   ngrok 터널 ◀──────────────────────────────┘                   │
│       │                                                          │
│       ▼                                                          │
│   localhost:3000 (Next.js 서버)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**동작 방식**:
1. ngrok이 외부에서 접근 가능한 URL 생성 (`https://abc123.ngrok.io`)
2. 해당 URL로 오는 모든 요청을 로컬 서버(`localhost:3000`)로 전달
3. fal.ai가 ngrok URL로 webhook을 보내면, ngrok이 로컬 서버로 전달

### ngrok 사용 방법

```bash
# 1. ngrok 설치 (https://ngrok.com)

# 2. 터널 시작
ngrok http 3000

# 3. 출력 예시
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000

# 4. 환경 변수 설정
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

---

## 4. NEXT_PUBLIC_APP_URL 환경 변수

### 코드에서의 사용

```typescript
// src/backend/routes/generation.ts
webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/generate/webhooks/fal`

// src/backend/routes/shoot.ts
webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/shoot/webhooks/fal`
```

### 환경별 설정

| 환경 | NEXT_PUBLIC_APP_URL | webhook_url 결과 |
|------|---------------------|------------------|
| **Vercel 프로덕션** | `https://sdeume-ai.vercel.app` | `https://sdeume-ai.vercel.app/api/generate/webhooks/fal` |
| **Vercel Preview** | `https://sdeume-ai-xxx.vercel.app` | `https://sdeume-ai-xxx.vercel.app/api/generate/webhooks/fal` |
| **로컬 + ngrok** | `https://abc123.ngrok.io` | `https://abc123.ngrok.io/api/generate/webhooks/fal` |
| **로컬 (ngrok 없음)** | `http://localhost:3000` | `http://localhost:3000/api/...` ← **fal.ai 접근 불가!** |

### 전체 플로우

```
1. 환경 변수 설정
   NEXT_PUBLIC_APP_URL=https://sdeume-ai.vercel.app

2. 학습 요청 시 webhook URL 생성
   webhookUrl = "https://sdeume-ai.vercel.app/api/generate/webhooks/fal"

3. fal.ai에 학습 요청
   POST fal.ai { ..., webhook_url: "https://sdeume-ai.vercel.app/api/..." }

4. fal.ai 학습 완료 후
   fal.ai → POST https://sdeume-ai.vercel.app/api/generate/webhooks/fal

5. 우리 서버가 webhook 수신
   → DB 업데이트 (lora_models 테이블)
   → user_face_models 업데이트
   → 이미지 생성 트리거
```

---

## 5. 로컬 개발 환경 옵션

### 옵션 1: ngrok 사용 (권장)

로컬에서 완전한 통합 테스트가 필요할 때 사용합니다.

```bash
# 1. ngrok 시작
ngrok http 3000

# 2. .env.local 수정
NEXT_PUBLIC_APP_URL=https://xxxx.ngrok.io

# 3. 개발 서버 재시작
pnpm dev
```

**장점**: 완전한 로컬 테스트 가능
**단점**: ngrok 무료 플랜은 세션마다 URL 변경

### 옵션 2: Vercel Preview 배포 활용

코드 변경 → Git push → Vercel Preview URL로 테스트

```bash
git push origin feature/my-branch
# Vercel이 자동으로 Preview URL 생성
```

**장점**: ngrok 불필요, 실제 환경과 동일
**단점**: 매번 배포 필요, 피드백 루프가 느림

### 옵션 3: 하이브리드 방식 (실용적)

| 작업 | 환경 |
|------|------|
| UI 개발 | 로컬 |
| 업로드/얼굴 분석 테스트 | 로컬 (브라우저에서 실행) |
| fal.ai 학습 테스트 | Vercel Preview 또는 ngrok |
| 프로덕션 테스트 | Vercel 메인 배포 |

---

## 6. 요약

| 질문 | 답변 |
|------|------|
| **webhook이 왜 필요?** | fal.ai 학습은 오래 걸려서, 완료 시 fal.ai가 우리 서버에 알려주는 방식이 효율적 |
| **로컬에서 ngrok이 왜 필요?** | fal.ai(외부)가 localhost(내 컴퓨터)에 직접 접근할 수 없어서, 터널이 필요 |
| **NEXT_PUBLIC_APP_URL 역할?** | webhook URL을 만들 때 사용되는 베이스 URL (fal.ai가 콜백할 주소) |

---

## 7. 관련 파일

| 파일 | 역할 |
|------|------|
| `src/backend/services/fal-client.ts` | fal.ai API 클라이언트, webhook_url 전송 |
| `src/backend/routes/generation.ts` | webhook URL 생성 및 webhook 수신 처리 |
| `src/backend/routes/shoot.ts` | shoot 관련 webhook URL 생성 |
| `.env.local` | 로컬 환경 변수 설정 |
| `.env.production` | 프로덕션 환경 변수 설정 (Vercel) |
