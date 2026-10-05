# 둘이, 일본 — senkyo

두 사람의 2026-12-22~27 일본 여행 플래너. Next.js App Router, TypeScript, Tailwind, Supabase Auth/PostgreSQL/Storage/Realtime, Google Places API (New)를 사용합니다.

제품 기준: `docs/FUNCTIONAL_SPEC.md` > `docs/TRIP_PLAN.md` > `AGENTS.md`.

## 개발

```bash
npm ci
cp .env.example .env.local
npm run dev
```

키가 비어 있어도 로그인 설정 안내와 production build는 동작합니다. 인증 없이 여행정보를 공개하거나 데모 계정으로 우회하지 않습니다. 실제 키와 계정은 사용자가 제공해야 합니다.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase 초기 설정

1. Supabase 프로젝트를 생성합니다. **Auth의 신규 사용자 가입 허용을 끕니다.** 앱에는 signup route가 없으며, Supabase 공개 signup도 비활성화해야 합니다. 비밀번호 로그인만 사용합니다.
2. SQL Editor 또는 migration 도구로 `supabase/migrations/`의 SQL 파일을 파일명 순서대로 적용합니다. RLS, 동일 여행 FK, private Storage 정책, Realtime publication이 포함됩니다.
3. `supabase/seed.sql`을 적용합니다. 6일 일정 전체를 삽입하며 재실행해도 사용자 수정값을 덮어쓰지 않습니다. `npm run seed:generate`로 TRIP_PLAN에서 다시 생성할 수 있습니다. 실제 예약번호·좌석·확인 URL·Place ID는 만들지 않습니다.
4. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 입력합니다. 기존 프로젝트의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 대체 설정으로 지원하며, 둘 다 있으면 publishable key를 사용합니다.
5. 아래 절차로 정확히 두 계정을 생성합니다. 두 계정 모두 EDITOR입니다. 외부 초대 UI는 없습니다.

### 두 계정 사전 생성

사용자가 실제 아이디/비밀번호를 정한 후에만 실행합니다. 아이디는 영문·숫자·`_`·`-`, 3~32자이며 소문자로 정규화합니다. 내부 인증 이메일은 `<아이디>@senkyo.invalid`이고 UI에는 노출하지 않습니다.

Git에서 제외되는 `.env.accounts.json`에 다음 구조로 **실제 사용자 제공값**을 입력하고 파일 권한을 `600`으로 제한하세요. 예시 문자열 그대로 계정을 생성하지 마세요.

```json
[
  {"username":"<첫 번째 아이디>","password":"<12자 이상 비밀번호>","display_name":"<표시 이름>"},
  {"username":"<두 번째 아이디>","password":"<12자 이상 비밀번호>","display_name":"<표시 이름>"}
]
```

`.env.local`에 서버 전용 service role key를 임시 설정한 후:

```bash
node --env-file=.env.local scripts/create-accounts.mjs .env.accounts.json
```

기존 계정의 비밀번호는 바꾸지 않습니다. 예상하지 못한 Auth 계정이 있으면 자동 삭제하지 않고 중단합니다. 부분 실패 시 DB 상태를 확인하고 재실행할 수 있습니다. 생성 후 계정 입력 파일은 안전하게 제거하고, 런타임에서 사용하지 않는 service role key도 제거하세요. 일반 로그인·조회·수정은 publishable/anon client와 사용자 세션/RLS만 사용합니다.

## Google 연결

- `GOOGLE_MAPS_SERVER_API_KEY`: 서버 Places 검색·상세·사진. Places API (New)만 허용하고 배포 방식에 맞는 서버 키 제한을 설정합니다.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: 지도 표시. Maps JavaScript API와 허용 웹사이트 referrer만 허용합니다.
- 서버 키에 웹사이트/HTTP referrer 제한을 적용하면 `API_KEY_HTTP_REFERRER_BLOCKED` 오류가 발생합니다. 브라우저 키와 서버 키를 분리하고 서버 키에는 Places API (New) API 제한과 서버 환경에 맞는 애플리케이션 제한을 사용하세요. [Google 키 제한 안내](https://developers.google.com/maps/api-security-best-practices)
- Google Maps URL 길찾기는 API 키 없이 가능합니다.
- Seed 장소는 정확한 Place ID가 없으므로 장소 상세를 연 뒤 검색 결과에서 지점을 연결하세요.
- Google 응답은 서버 `no-store`, 브라우저 메모리에서만 유지합니다. Place ID와 사용자가 선택한 이름·메모·후보 설정만 DB에 저장합니다. 사진에는 제공된 작성자 표기를 표시합니다.
- Routes API는 사용하지 않습니다. 고정 열차·셔틀 시간을 외부 경로로 변경하지 않습니다.

## 비용·시간·공동 편집

JPY는 정수 엔입니다. 50/50의 홀수 1엔은 A에게 배분합니다. CUSTOM에서는 A 부담액을 입력하고 B 금액은 차액으로 계산합니다. DB가 분담액 합계를 검사하고 `expense_splits`를 자동 생성합니다.

교통 예산 Seed는 **2인 총액**, 날짜별 교통비와 이동 구간은 **1인 예상액**입니다. N'EX 왕복권 및 날짜별 배분을 중복 합산하지 않습니다. 오늘 예상액은 문서의 날짜별 교통비와 등록된 관광비 기준이며 항공·숙박·미입력 식비 등은 제외합니다.

날짜는 date-only, 예약 datetime은 timezone-aware이며 UI는 Asia/Tokyo를 사용합니다. 원문의 `전후`·시간 범위는 `time_label`에 보존합니다. 예약 상태와 계획의 시간 고정 여부는 별개입니다.

Realtime은 여행별 변경 시 최신 데이터를 다시 조회합니다. 편집 폼은 처음 열었을 때의 `updated_at`으로 저장하므로 다른 사용자의 수정과 충돌하면 저장을 거절하고 새로고침을 안내합니다.

일정 상세에서 Google 장소 검색·새 장소 등록·기존 장소 연결과 예약 등록·연결을 바로 할 수 있습니다. 하나의 일정에 여러 장소를 연결할 수 있으며, 날짜별 지도에는 대표 장소, 추가 연결 장소, 식사 후보, 이동 출발지·도착지를 함께 표시합니다. 새 일정은 선택한 날짜의 맨 아래에 추가됩니다. `순서 편집`에서 손잡이를 드래그하거나 위·아래 버튼으로 이동한 뒤 저장하세요. 순서 변경은 DB에서 한 번에 적용하며 다른 사용자의 변경이 있으면 다시 편집하도록 안내합니다. 기존 DB에는 `202610050004_schedule_connections.sql`이 필요합니다.

## 예약 첨부·오프라인

`reservation-files`는 private bucket입니다. PDF/PNG/JPEG/WEBP, 최대 10MB이며 서버에서 MIME·파일 서명을 확인합니다. 조회는 60초 signed URL로 제공합니다. DB 저장 실패 시 업로드 객체 정리를 시도합니다.

예약 첨부에는 파일과 별도로 제목과 텍스트(최대 10,000자)를 저장할 수 있습니다. 텍스트는 여행 멤버에게만 공개되며 HTML을 실행하지 않습니다. 기존 DB에는 `202610050003_text_attachments.sql`을 적용해야 합니다. 기존 파일 첨부는 보존됩니다.

PWA는 공개 오프라인 화면과 정적 리소스만 캐시합니다. 인증 페이지/API 응답/첨부파일은 Service Worker에 저장하지 않습니다. 여행정보 스냅샷은 로그인한 현재 탭의 sessionStorage에만 보관하고 로그아웃 시 지웁니다. 오프라인 접근은 같은 탭에서 이전에 조회한 정보만 지원합니다. 장소 주소는 Google 정책에 따라 영구 복제하지 않으므로 오프라인에서 제공되지 않을 수 있습니다.

## 배포

Vercel에 이 저장소를 연결하고 환경변수를 설정합니다. 공개 signup 비활성화, migration·Seed·계정 생성, RLS·Storage 및 실제 API 통합 검증을 마친 뒤 배포합니다. `.env.local` 및 실제 계정/키는 커밋하지 않습니다.

Vercel 환경변수를 추가하거나 변경한 뒤에는 다시 배포해야 합니다. `NEXT_PUBLIC_` 값은 빌드 시 브라우저 번들에 포함되므로 기존 배포에는 자동 적용되지 않습니다.

`vercel.json`은 Next.js 프레임워크와 기본 출력 디렉터리를 명시합니다. Vercel 프로젝트의 Root Directory는 `package.json`이 있는 저장소 루트로 설정하세요. Framework Preset이 Other이거나 Output Directory가 `public`이면 아이콘 등 정적 파일만 제공되고 홈·로그인·API가 `404: NOT_FOUND`를 반환할 수 있습니다. 대시보드에서 Framework Preset을 Next.js로 설정하고 Output Directory의 수동 override를 끈 뒤 새 설정이 포함된 커밋을 배포하세요.

로컬 테스트는 실제 PostgreSQL 엔진(PGlite)에서 migration·Seed·권한·FK·정산을 검증합니다. Supabase 운영 서비스 및 실제 Google API를 사용한 통합 검증은 사용자 키 설정 후 별도로 필요합니다.

구현 참고: [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Places 필드 선택](https://developers.google.com/maps/documentation/places/web-service/choose-fields).

## 브라우저 검증

```bash
npx playwright install chromium
npx playwright install-deps chromium
npm run test:e2e
```

E2E는 `tests/e2e-server.mjs`의 로컬 Supabase 계약 fixture를 사용합니다. fixture 계정/키/Google 응답은 테스트 전용이며 실제 앱 계정이나 운영 API를 생성하지 않습니다. DB 권한 테스트는 fixture가 아닌 PGlite에서 별도로 실행합니다. 현재 로그인 보호, 320px 화면, 날짜별 일정, 준비물 체크, 예약 수정, 지출·정산, 후보 검색·저장·식사 연결·제거, 오래된 폼 저장 거부, 오프라인 조회를 검증합니다.
