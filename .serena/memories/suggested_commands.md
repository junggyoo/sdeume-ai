# Suggested Commands

## 패키지 매니저
**pnpm** 사용 (v9.15.0)

## 개발 서버
```bash
pnpm dev              # Next.js 개발 서버 (Turbopack)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 실행
```

## 테스트
```bash
pnpm test             # Vitest 단위/통합 테스트 실행
pnpm test:watch       # 테스트 watch 모드
pnpm test:ui          # Vitest UI 모드
pnpm test:coverage    # 커버리지 리포트
pnpm test:e2e         # Playwright E2E 테스트
pnpm test:e2e:headed  # E2E 브라우저 표시 모드
pnpm test:e2e:watch   # E2E UI 모드
pnpm test:all         # 전체 테스트 (병렬)
```

## 코드 품질
```bash
pnpm lint             # ESLint 실행 (src 디렉토리)
pnpm typecheck        # TypeScript 타입 체크
```

## Modal (AI Compute)
```bash
pnpm modal:setup      # Modal 초기 설정
pnpm modal:deploy     # Modal 배포
pnpm modal:validate   # Modal 배포 검증
pnpm modal:models:download  # 모델 다운로드
pnpm modal:models:list      # 모델 목록 확인
```

## 기타
```bash
pnpm env:check        # 환경 변수 체크
pnpm qstash:dev       # QStash 로컬 개발 서버
```

## Git 명령어 (Darwin/macOS)
```bash
git status            # 상태 확인
git add <file>        # 파일 스테이징
git commit -m "..."   # 커밋
git push              # 푸시
git pull --rebase     # 리베이스 풀
git log --oneline     # 간결한 로그
```

## 유틸리티 (Darwin/macOS)
```bash
ls -la                # 디렉토리 목록
cd <path>             # 디렉토리 이동
grep -r "pattern" .   # 패턴 검색
find . -name "*.ts"   # 파일 검색
cat <file>            # 파일 내용 출력
```
