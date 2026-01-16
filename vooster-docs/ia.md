# Sdeume AI Information Architecture (IA)

캡틴, 아래 문서는 합의된 서비스 경험(데이터 인입·쇼룸·리빌 중심), 미니멀 Topbar+Stepper+Sticky CTA 네비게이션, 그리고 필수 로그인 정책을 반영한 최종 IA입니다. 초보자 중심, 한 화면 하나의 목표 원칙을 일관되게 녹였습니다.

## 1. Site Map (사이트맵)

- Marketing (비로그인)
  - Home (랜딩)
  - Themes (프리뷰/모션 썸네일)
  - How It Works (프로세스 안내: 4단계)
  - Pricing (티어 비교)
  - FAQ
  - Refund Policy
  - Terms of Service
  - Privacy Policy
- Auth
  - Login (소셜/이메일 Magic Link)
  - Sign Up
  - Magic Link Verify/Callback
- App (로그인 필요)
  - Dashboard (나의 프로젝트/진행 현황)
    - My Projects (목록)
    - Notifications (푸시/이메일 설정)
  - Project (/:projectId)
    - Upload (Guidance & Upload)
    - Theme (Theme Selection)
    - Shooting (Training/Generating)
    - Reveal (언박싱)
    - Gallery (핀터레스트형 그리드)
    - Viral Movie Maker (15초 영상)
    - Re-roll (재생성 요청)
  - Billing & Plan
    - Current Plan (Free/Basic/Pro/Max)
    - Upgrade (Checkout)
    - Payment History / Invoice
  - Refund Center
    - Eligibility Check (30% 기준 셀프 체크)
    - Request Form
    - Case Status

접근성/반응형 참고
- 모바일 우선: 모든 주요 액션은 하단 Sticky CTA로 제공
- 데스크톱: 1040px 컨테이너, 마켓팅 갤러리는 3열, 앱 갤러리는 3–4열

## 2. User Flow (사용자 흐름)

핵심 과업 1: Free 체험으로 생성 → 결과 공유
1) 랜딩 → “무료 체험” 클릭
2) 로그인(소셜/이메일 Magic Link)
3) 새 프로젝트 생성(신랑/신부 선택) → Upload (20~30장 대량 선택)
4) AI 자동 분류(A/B/C) → 부족 각도만 추가 요청 → Soft Pass 허용(15장+)
5) Theme 선택(스튜디오 스탠바이 로딩 → 모션 썸네일 탐색 → 얼굴 버블 오버레이 → 룩북 바텀시트) → "이 테마로 촬영"
6) Shooting Phase 1(학습 10–15분) 푸시 ON → 앱 닫기 가능
7) Shooting Phase 2(생성 5분) Drop & Blur → 디테일링
8) Reveal(왁스 실링 언박싱) → Gallery 확인
9) Viral Movie Maker 15초 미리보기 → 인스타 스토리 원클릭 공유

핵심 과업 2: Free → 유료 업그레이드(티어 전환)
1) Gallery에서 다운로드/리롤 제한 노출(Free: 리롤 불가)
2) “더 많은 테마/리롤을 원하시나요?” 업셀 모달 → Pricing
3) 티어 비교 → Upgrade(Checkout) → 결제 완료
4) 프로젝트로 복귀 → 추가 테마 촬영/리롤/리터치 사용

핵심 과업 3: 결과 불만족 시 환불 요청
1) Reveal/Gallery → “안 닮으면 100% 환불” 배너 클릭
2) Refund Center → Eligibility Check(사용 가능 사진 < 30% 셀프 체크)
3) 증빙 업로드/설명 작성 → 제출
4) 심사 결과 통지(알림) → 승인 시 접근 제한 및 환불 처리 안내

장애/복귀 흐름
- 학습 대기 중 앱 종료 → 푸시 알림으로 복귀 → Dashboard/Project로 자동 재진입
- 업로드 중 중단 시 자동 저장 → 재진입 시 진행 단계 표시

## 3. Navigation Structure (네비게이션 구조)

제안: Topbar(미니멀 GNB) + 상단 Stepper(플로우 구간) + 하단 Sticky CTA(맥락형)

- Global Topbar
  - Marketing: 좌 로고 / 우 메뉴(Themes, How It Works, Pricing, FAQ) + Primary “무료 체험”
  - In-Flow(App): 좌 로고 + 현재 프로젝트명/상태, 우측 보조(도움말, 프로필)
- Stepper (Upload → Theme → Shooting → Reveal)
  - 현재 단계 Deep Navy, 완료 단계 Teal, 미도달 회색
  - 모바일: 얇은 바/도트 형태, 데스크톱: 라벨+아이콘
- Sticky CTA (모바일 우선)
  - 예: “사진 한 번에 선택하기” → “다음으로” → “이 테마로 촬영하기” → “갤러리로 이동” 등
  - 컨텍스트에 따라 우측은 Primary, 좌측은 Secondary(건너뛰기/이전)
- Footer (마케팅 페이지)
  - 간결 링크(정책·지원·SNS), SEO용 구조화 링크

반응형 규칙
- 모바일: 햄버거 메뉴, Sticky CTA 상시 노출
- 태블릿: 상단 메뉴 최대 3개, 나머지 More
- 데스크톱: 풀 GNB, Stepper 라벨 표시

접근성
- 키보드 포커스 링, 대비 4.5:1, 터치 영역 44px+
- “움직임 줄이기” 옵션 시 모션 최소화

## 4. Page Hierarchy (페이지 계층 구조)

- / (Depth 1)
  - /themes (Depth 1)
  - /how-it-works (Depth 1)
  - /pricing (Depth 1)
  - /faq (Depth 1)
  - /refund-policy (Depth 1)
  - /terms (Depth 1)
  - /privacy (Depth 1)
- /auth (Depth 1)
  - /auth/login (Depth 2)
  - /auth/signup (Depth 2)
  - /auth/magic-link (Depth 2)
- /app (Auth Required) (Depth 1)
  - /app/dashboard (Depth 2)
    - /app/dashboard/projects (Depth 3)
    - /app/dashboard/notifications (Depth 3)
  - /app/billing (Depth 2)
    - /app/billing/plan (Depth 3)
    - /app/billing/history (Depth 3)
  - /app/refund (Depth 2)
    - /app/refund/eligibility (Depth 3)
    - /app/refund/request (Depth 3)
    - /app/refund/:caseId (Depth 3)
  - /app/studio/:projectId (Depth 2)
    - /app/studio/:projectId/upload (Depth 3)
    - /app/studio/:projectId/theme (Depth 3)
    - /app/studio/:projectId/shooting (Depth 3)
    - /app/studio/:projectId/reveal (Depth 3)
    - /app/studio/:projectId/gallery (Depth 3)
    - /app/studio/:projectId/movie (Depth 3)
    - /app/studio/:projectId/reroll (Depth 3)

비고
- 마케팅 페이지는 공개, /app 이하 전부 로그인 필요
- 프로젝트 단위 URL로 복귀/공유/상태 관리 용이

## 5. Content Organization (콘텐츠 구성)

| 페이지 | 핵심 콘텐츠 요소 |
|---|---|
| Home | Hero(Serif 타이포+오로라 텍스처), UVP 3가지, 5단계 요약, 테마 프리뷰, 후기/신뢰 배지(가벼운), “무료 체험” CTA |
| Themes | 3개 테마 모션 썸네일, 각 테마 요약, [자세히 보기] 바텀 시트 샘플(8종), 얼굴 버블 오버레이 데모 |
| How It Works | 5단계 흐름(이미지/짧은 캡션), Stepper 미리보기, 접근성·보안 안내 |
| Pricing | 티어 비교 표(컨셉/장수/리롤/리터치), 추천 뱃지, FAQ 링크, “지금 시작하기” CTA |
| FAQ | 아코디언 Q/A, 환불 기준/티어 정책 강조, 고객지원 링크 |
| Refund Policy | “30% 미만” 기준 상세, 도식+예시, 처리 절차 타임라인 |
| Login/Signup | 소셜 버튼(Apple/Google/Kakao), Email Magic Link, 개인정보/동의 |
| Dashboard | 진행 중/완료 프로젝트 카드, 상태 배지(학습/촬영/보정/완료), 최근 알림 |
| Studio Upload | 신랑/신부 탭, 3초 O/X 움짤, 대량 선택(20~30장), 실시간 버킷 분류(A/B/C), Gap Filling 프롬프트, Soft Pass 안내 |
| Studio Theme | 스튜디오 스탠바이 로딩 화면, 모션 썸네일 그리드, 얼굴 버블 롱프레스 오버레이, 룩북 바텀시트, "이 테마로 촬영" CTA |
| Studio Shooting | Phase 1(학습) 상태카드+푸시 토글, Phase 2 Drop & Blur, Light Sweep “디테일 보정 중” |
| Studio Reveal | 왁스 실링 언박싱, 베스트컷 하이라이트, 다운로드 CTAs, 환불 배너 |
| Studio Gallery | Masonry 2–3열(모바일 2), 고화질 미리보기, 리롤/리터치 제한 표시, 선택 다운로드 |
| Viral Movie Maker | 자동 선택된 5–7컷 리스트, 타임라인 미리보기, 테마별 BGM, 공유 프리셋 |
| Re-roll | 티어별 한도 안내, 프롬프트/설정 요약, 요청 버튼, 처리 큐 상태 |
| Billing & Plan | 현재 플랜 카드, 업그레이드 배너, 결제 수단, 영수증 |
| Refund Center | Eligibility 체크리스트, 결과 캡처 업로드, 요청 양식, 진행 상태 뱃지 |

접근성/SEO 메모
- 모든 주요 이미지에는 대체 텍스트 제공(예: “가든 스튜디오 샘플 시네마그래프”)
- Heading 구조 H1→H2→H3 일관, 질문형 FAQ 스키마 마크업 적용
- 가격/정책 페이지는 정적 설명과 표를 통해 스니펫 최적화

## 6. Interaction Patterns (인터랙션 패턴)

공통
- 모달/바텀시트: 테마 자세히 보기, 업셀, 결제 확인
- 토스트/스낵바: 업로드 완료, 분류 상태, 리롤 결과, 오류 안내
- 스테퍼: 단계 진행/완료 표시, 이전 단계 복귀는 허용하되 데이터 손실 경고
- 로더: 오로라 앰비언트(대기), Light Sweep(디테일링), Blur→Sharpen 프리로드
- 푸시/알림: 학습 완료→촬영 시작, 무비 생성 완료

업로드
- 대량 선택 드래그/멀티픽커, 진행률 표시, 실패 파일 재시도
- AI Gap Filling 카드("옆모습 3장 더 필요") + 자동 스크롤 포커스

테마/촬영
- 얼굴 버블 롱프레스→오버레이, 해제 시 원복 애니메이션
- “움직임 줄이기” 활성 시 시네마그래프를 정지 프레임으로 대체
- Shooting Phase 1 종료 시 인앱 배너 + 시스템 푸시 동시 노출

리빌/공유
- 언박싱: 왁스 실링 → Bloom → 페이드 인(350–500ms)
- 갤러리 무한 스크롤(지연 로드), 선택 다운로드, 워터마크(프리뷰)
- 공유: 인스타/카카오/링크 복사(OG 태그 최적화)

인증/결제/환불
- Login: 소셜 원클릭, Magic Link 대체, 실패 시 명확 에러 복구
- Checkout: 주소/세금 필드 최소화, 결제 버튼 1개, 실패 시 상태 유지
- Refund: Eligibility 셀프 체크(Yes/No), 조건 미충족 시 가이드 토스트

접근성
- 키보드 트랩 방지, 포커스 이동(모달 오픈/클로즈)
- 색각 보정 대비: 상태 메시지에 아이콘+텍스트 동시 제공
- 터치 피드백: 버튼/카드 프레스 상태 60–120ms

## 7. URL Structure (URL 구조)

원칙
- SEO 친화적, 읽기 쉬운 하이픈 소문자 영문 슬러그
- 리소스 우선: /themes, /pricing, /faq 등 정적 페이지 인덱싱
- 프로젝트는 비공개(로그인 필요)이나 경로 정합성 유지

패턴
- 마케팅: /, /themes, /how-it-works, /pricing, /faq, /refund-policy, /terms, /privacy
- 인증: /auth/login, /auth/signup, /auth/magic-link?token=...
- 앱 대시보드: /app/dashboard, /app/dashboard/projects
- 결제: /app/billing/plan, /app/billing/history
- 프로젝트: /app/studio/:projectId/(upload|theme|shooting|reveal|gallery|movie|reroll)
- 환불: /app/refund/(eligibility|request|:caseId)

파라미터/예시
- 테마 상세 딥링크: /themes?highlight=garden-studio
- 리롤 요청: /app/studio/abc123/reroll?selection=4&reason=face-soft
- OG/소셜: 마케팅 페이지만 공개 OG 태그 적용, 앱 내부는 noindex

SEO 베스트 프랙티스
- Canonical URL 설정, hreflang(ko-KR) 옵션
- FAQ/How It Works에 구조화 데이터(FAQPage/HowTo) 적용
- 이미지에 파일명 규칙: sdeume-white-studio-sample.jpg

## 8. Component Hierarchy (컴포넌트 계층 구조)

글로벌
- AppShell
  - Header(GNB Topbar: Logo, Nav, CTA)
  - StepperBar(Progress, Phase Tooltip)
  - StickyCTA(Primary, Secondary)
  - Footer(Marketing links)
- Navigation
  - MobileNav(Hamburger, Drawer)
  - Breadcrumbs(마케팅 한정)
- Feedback
  - Toast/Snackbar
  - Modal/BottomSheet
  - ProgressBar/Spinner(Aurora)
- Auth
  - SocialLoginButtons(Apple/Google/Kakao)
  - MagicLinkForm
  - AuthGuard(Route Wrapper)

페이지 공통
- SectionHeader(Serif Title, Subtitle)
- Card
  - ProjectCard(썸네일, 상태 배지)
  - ThemeCard(16:9, 선택 상태, 추천 뱃지)
  - InfoCard(정책/가이드)
- Tables
  - PricingTable(티어 비교)
  - BillingHistoryTable
- Forms
  - UploadDropzone(+ 대량 선택)
  - RefundRequestForm(Eligibility Checklist, FileUpload)
  - PaymentForm(간소화)

스튜디오(프로젝트) 전용
- Upload
  - RoleTabs(신랑/신부)
  - OXGuide(3초 루프)
  - BucketBoard(A/B/C 카운터, 목표치)
  - GapFillingPrompt
- Theme
  - MotionThumbnail(시네마그래프)
  - FaceBubble(롱프레스 오버레이)
  - LookbookSheet(8종 샘플)
- Shooting
  - PhaseStatusCard(학습/촬영/보정)
  - DropAndBlurTray
  - LightSweepOverlay
  - NotificationToggle
- Reveal & Gallery
  - WaxSealReveal
  - MasonryGallery
  - ImagePreviewModal(워터마크 옵션)
  - DownloadSelector
  - RerollButton(티어 조건 표시)
  - RetouchRequestButton(티어 조건 표시)
- Viral Movie Maker
  - AutoSelectStrip(5–7컷)
  - TimelinePreview
  - BGMPicker(테마 프리셋)
  - SharePresetButtons(Instagram/Kakao/Link)

상태/배지
- PlanBadge(Free/Basic/Pro/Max)
- StatusChip(학습/촬영/보정/완료)
- AIReducedMotionToggle(“움직임 줄이기”)

디자인 토큰 일치(요약)
- 색상: Primary #0E1B2A(Desktop), #1A2B3C(Mobile CTA), Secondary #F6F1EA, Accent Rose #B9896E, Accent Teal #2E5E5E
- 타이포: Serif(Noto Serif KR) 헤딩, Sans(Pretendard) 본문/라벨
- 레이아웃: Desktop 12col/1040px, Tablet 8col/720px, Mobile 4col Fluid
- 라운드/쉐도우: Card 12px, Input 10px, shadow-sm/md 사용

반응형 가이드
- 모바일: 스튜디오 단계 전부 1열, 갤러리 2열 Masonry, Sticky CTA 상시
- 태블릿: 갤러리 2–3열, Stepper 라벨 간소화
- 데스크톱: 갤러리 3–4열, 테마 카드 3열, 보조 정보 우측 Col 배치

보안/인증 구조 반영
- 모든 /app/* 경로는 AuthGuard + 세션/권한 검사
- 업로드 전 TLS, 저장 시 암호화, Free 티어 임시 데이터 정리(운영 정책)