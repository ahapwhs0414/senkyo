# 둘이, 일본 — senkyo

2026-12-22~27 두 사람의 겨울 일본 여행. 계획을 읽고 예약자료와 준비 상태를 관리합니다.
여행 데이터: [TRIP_PLAN 2026-10-06-r3](docs/TRIP_PLAN.md). 기능·디자인: [개편안](docs/SENKYO_RENEWAL_PLAN.md), [구현 계약](docs/FUNCTIONAL_SPEC.md).

## 개발과 검증

Node.js 24 권장(잠금 의존성은 Node 22.12+/24/26+ 필요).

```bash
npm ci
npx --no-install next typegen
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
node scripts/import-plan.mjs --check
```

키가 없어도 로그인 연결 안내와 production build는 동작합니다. 임의 계정이나 인증 우회는 없습니다.
브라우저 검증은 `npx playwright install --with-deps chromium` 후 `npm run test:e2e`.
클라우드의 설치된 Chromium은 `npm run test:e2e -- --config /workspace/shared/senkyo-playwright.config.ts`로 사용합니다.
E2E는 테스트 전용 Supabase 계약 fixture, DB 보존/권한은 실제 PostgreSQL 엔진 PGlite로 검증합니다.
운영 Google API·Supabase 검증과 동일하지 않습니다.

## DB 초기화와 기존 데이터 반영

[비파괴 migration 적용·검토·롤백 절차](docs/MIGRATION_R3.md)를 먼저 읽으세요.
신규 DB는 migrations를 파일명 순으로 적용하고 seed.sql을 적용합니다.
기존 DB는 검증된 백업 후 202610060005/006 두 migration을 검토해 적용합니다. 이번 작업에서 운영 DB에 적용하지 않았습니다.
계획 생성은 `npm run seed:generate` 또는 `node scripts/import-plan.mjs`; 명시적 표와 기존 UUID 매핑으로 JSON/SQL을 재생성합니다.
출력은 계획 필드만 갱신하며 예약자료·첨부·기존 준비 상태를 보존합니다. 옛 숙소 자료는 보관합니다.
지출·정산·일정/장소/후보 식당 편집 UI와 쓰기는 제거했습니다. 기존 비용 데이터는 삭제하지 않습니다.

## Supabase와 두 계정

Supabase Auth 신규 가입을 끄고 private reservation-files bucket과 migration/RLS를 준비합니다.
`.env.example`을 참고해 gitignored `.env.local` 또는 환경 설정에 아래 값을 입력합니다. 실제 값은 저장소/채팅에 남기지 마세요.

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (없으면 NEXT_PUBLIC_SUPABASE_ANON_KEY fallback)

두 계정은 사용자가 실제 아이디·비밀번호를 정한 뒤에만 생성합니다.
권한 600의 gitignored `.env.accounts.json`에 정확히 두 객체(username,password,display_name)를 입력합니다.
username은 영문·숫자·_·-, 3~32자, 소문자 정규화; password는 12자 이상.
SUPABASE_SERVICE_ROLE_KEY는 계정 생성 단계에서만 임시로 서버에 설정합니다.

```bash
node --env-file=.env.local scripts/create-accounts.mjs .env.accounts.json
```

기존 계정 비밀번호는 변경하지 않으며 예상 밖 계정은 삭제하지 않고 중단합니다.
생성 후 입력 파일과 임시 service role key를 제거합니다. 일반 앱은 publishable client와 사용자 세션/RLS로 동작합니다.

## Google Maps

계획서의 장소명 검색 링크가 기본입니다. API 키 없이 동작하며 지점·운영시간의 검증 완료를 뜻하지 않습니다.
코메다/요시노야/돈키호테 등의 미확정 지점은 임의로 생성하지 않습니다.
내장 지도는 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY(Maps JavaScript API, 실제 웹사이트 referrer 제한),
확인된 Place ID의 상세/좌표 조회는 GOOGLE_MAPS_SERVER_API_KEY(Places API New, 서버에 맞는 제한)가 필요합니다.
서버 키에 브라우저 HTTP referrer 제한을 적용하지 마세요. 고정 송신 IP가 없는 서버에 임의 IP를 등록하지 마세요.
NEXT_PUBLIC 값 변경 후에는 새 build가 필요합니다. Google API 장애 중에도 외부 링크는 사용할 수 있습니다.
[지도 진단 기록](docs/RENEWAL_CHANGELOG.md)을 참고하세요. 운영 설정은 이번 환경에 없어 미검증입니다.

## 자료·오프라인·시간

텍스트/파일/혼합 자료, private Storage, PDF/PNG/JPEG/WEBP 10MB, 실제 MIME/서명 검사, 60초 signed URL.
사업자 원본 앱·갱신 QR이 필요할 수 있으므로 필요한 파일은 여행 전에 별도 다운로드합니다.
오프라인은 같은 탭의 이전 조회 snapshot만; 첨부/API는 캐시하지 않고 로그아웃 시 지웁니다.
여행 날짜·시간은 Asia/Tokyo. PRE_TRIP과 날짜별 휴대 상태를 구분하고 개인/공동 항목을 이름으로 병합하지 않습니다.

## 변경과 검토

[단계별 변경·검증](docs/RENEWAL_CHANGELOG.md), [migration 적용 순서](docs/MIGRATION_R3.md).
운영 DB 삭제·Vercel 배포는 수행하지 않습니다. 배포 시 Next.js Framework Preset과 저장소 루트/기본 출력 디렉터리를 사용하세요.
Pretendard 1.3.9를 자체 제공하며 [OFL 라이선스](public/fonts/OFL.txt)를 포함합니다.
