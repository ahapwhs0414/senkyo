# 개편 단계 기록 — 2026-10-06~07

기준 커밋: 7d47e1f (main). 여행 데이터 2026-10-06-r3, 기능·디자인 SENKYO_RENEWAL_PLAN.
운영 DB 적용/삭제 및 Vercel 배포는 수행하지 않는다.

## 1. 조사와 기존 화면

- AGENTS, FUNCTIONAL_SPEC, TRIP_PLAN, 개편안과 일정·지도·예약·첨부·API·DB 정책을 조사했다.
- 클라우드 초기 검증: lint/typecheck/build, 단위/DB 34개, 기존 E2E 7개 통과. 이는 개편 전 결과다.
- 기존 캡처: /workspace/shared/senkyo-renewal/before-today.png, before-places.png.
- 지도 확인: seed Place ID=null; 내장 지도는 Places 좌표에 의존; 브라우저/서버 키 분리 필요; script.onload만으로 인증 성공을 보장하지 못함.
- 운영 API 키/referrer/결제/DB 지점 연결은 미확인. 외부 검색 링크를 독립 제공하고 gm_authFailure/timeout/부분 실패를 처리했다.

## 2. 데이터·문서·권한

- 명시적 표 importer, plan_key와 기존 UUID 매핑, 활성 일정 108개/장소 40개.
- 005 schema/권한/자료 transaction, 006 계획 갱신. 옛 호텔·폐기 일정/준비 항목은 보관하고 사용자 자료를 삭제하지 않는다.
- 원래 예약번호·첨부·체크 상태·일정 메모 유지, 새 호텔은 별도 빈 자료 슬롯.
- PRE_TRIP, 공통 항목 일정 연결, 날짜/담당자별 휴대 체크 분리.
- 지출/후보/계획 쓰기 API 제거 및 DB 정책/권한 차단. 자료/준비/쇼핑/긴급/메모 쓰기 유지.
- AGENTS, FUNCTIONAL_SPEC, README의 충돌하는 요구를 갱신했다.
- 검증: PGlite에서 기존 seed + 사용자 예약·텍스트/파일·체크를 넣은 뒤 005/006 적용, 재적용, 계획 롤백, 새 사용자 수정 보존을 확인했다. 신규 빈 DB 설치와 snapshot 없는 롤백 거절도 통과했다. importer 결과는 활성 일정 108개/장소 40개로 일치한다.

## 3. 공통 디자인과 오늘 팝업

- 회백색/흰 카드/딥그린, 겨울 배지, 로컬 Pretendard(OFL), 공통 sheet·폼·오류/로딩 적용.
- 오늘은 실제 날짜/미리보기/출발 전/여행 후를 구분하고 현재/다음 한 일정의 주요 행동을 강조한다.
- 전체보기는 동일 날짜 팝업, 두 영역·필터·합계, 고정 그룹 순서, native 포커스 고정/복귀·ESC/배경 닫기·스크롤 잠금.
- 검증: 320/390/768/1280px 오늘·일정 상세, 긴 지점명, 글자 200% 확대와 reduced-motion에서 가로 넘침을 확인했다. 팝업 날짜·포커스·ESC·배경 닫기·체크 후 스크롤 복귀 및 날짜별 휴대 상태 분리를 브라우저에서 확인했다. native dialog 기본 max-width로 남던 모바일 우측 여백을 제거했다.

## 4. 읽기 일정·고정 식당·이동자료

- 일정 편집/순서/장소 연결/후보 UI 제거, 고정 식당 복수 구조와 검색 링크 유지. 미정 지점은 안내한다.
- 이동 상세에서 기존 예약 연결 또는 비예약 자료묶음을 한 transaction으로 생성한다.
- 여러 예약/여러 일정 연결, 텍스트/파일/혼합 첨부, 제목/설명·복사·재발급 URL 유지.
- 준비물/행동 작성·수정·체크는 상세 안에서 전환하여 팝업을 중첩하지 않는다.
- 검증: 고정 식당 지도 URL과 미정 지점의 링크 부재, 제거 API 거절, 여러 자료 연결, 텍스트/혼합 첨부, signed URL 재발급을 브라우저에서 확인했다. 파일만/텍스트만/혼합 레코드와 자료 생성 transaction은 DB 테스트로 검증했다. 잘못된 파일 거절과 업로드 후 DB 실패 시 Storage 정리도 확인했다.

## 5. 준비·지도·유지 화면

- 준비 탭의 여행 전/여행 중, 담당자·일별 상태, 보관된 개인 자료, 쇼핑·긴급정보·메모 유지.
- Realtime + 주기 갱신, 낙관적 체크 실패 복구, 오래된 폼 저장 거부.
- 지도 API 실패/미연결에서도 목록과 외부 링크 제공, 인증·Google 실패 구분.
- 검증: PRE_TRIP 비반복, 일정 준비물 작성·수정·체크·삭제, 체크 저장 실패 복구, 서로 다른 두 계정의 주기 갱신, 지도 로드/인증 실패 시 외부 링크 유지, 읽기 전용 오프라인 화면을 확인했다. 오래된 예약 폼은 저장을 거절하고 최신 행을 다시 조회하도록 수정했다. 열린 폼의 입력을 보존하며, 다시 열면 다른 사용자의 최신 값이 보인다.

## 6. 최종 검증

최종 확인: 2026-10-07. Node 24.19.0, 저장소 lockfile 의존성, 시스템 Chromium 사용.

| 명령 | 결과 |
|---|---|
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | 4개 파일, 30개 테스트 통과 (PGlite DB 13개 포함) |
| `npm run build` | Next.js production build 통과 |
| `node scripts/import-plan.mjs --check` | r3 생성 결과 일치: 일정 108개, 장소 40개 |
| `npm run test:e2e -- --config /workspace/shared/senkyo-playwright.config.ts` | 13개 통과, 38.9초 |
| `git diff --check` | 통과 |

브라우저 검증에는 600자가 넘는 예약번호 저장·표시·복사, 충돌 후 최신 예약 재열기, 팝업 저장 실패 복구를 포함한다.
화면 검증 중 발견한 체크 후 배경 스크롤 이동, 충돌 후 이전 값 재사용, 모바일 dialog 기본 너비 제한을 수정했다.
텍스트 선택 및 가상 시계의 테스트 설정 오류도 수정한 뒤 전체 E2E를 통과했다.

클라우드 작업공간의 검증 산출물(운영 데이터 없음):

- `/workspace/shared/senkyo-renewal/final-checks.log`: lint/typecheck/단위·DB/import 검증.
- `/workspace/shared/senkyo-renewal/final-build.log`: 최종 lint/typecheck/production build.
- `/workspace/shared/senkyo-renewal/final-e2e.log`: 최종 브라우저 13개 결과.
- `before-today.png`, `before-places.png`: 개편 전 화면.
- `after-today-baseline.png`: 같은 320px 화면 조건의 개편 후 오늘.
- `after-today-{320,390,768,1280}.png`: 네 가지 너비의 오늘 전체 화면.
- `after-schedule-sheet-{320,390,768,1280}.png`: 고정 식당 상세 팝업.
- `after-preparation-sheet.png`, `after-travel-materials.png`, `after-attachment-error.png`, `after-map-fallback.png`: 준비 팝업·이동자료·오류·지도 대체 화면.

이미지 경로의 공통 디렉터리는 `/workspace/shared/senkyo-renewal`이다. 캡처와 실행 로그는 저장소 밖의 검토 산출물이며 Git에 포함하지 않았다.

## 7. 검토·적용 경계

- 적용할 파일은 `supabase/migrations/202610060005_renewal_schema.sql`, 이어서 `202610060006_plan_r3.sql`이다. 사전 조회·백업·ID 대조·복원 DB 시험·롤백 순서는 [MIGRATION_R3](MIGRATION_R3.md)에 정리했다.
- 운영 DB·Storage 데이터를 읽거나 수정·삭제하지 않았고 Vercel 배포도 수행하지 않았다. migration은 로컬 PGlite에만 적용했다.
- 실제 Supabase/Google 환경값이 없어 운영 로그인·Storage·Realtime·Google 키/referrer/결제 성공은 검증하지 않았다. E2E는 두 테스트 계정과 계약 fixture를 사용하며, 계정 간 동기화는 주기 갱신 경로를 검증했다.
- 미확정 지점, Place ID, 좌표, 예약번호·좌석·QR은 생성하지 않았다. 장소 검색 링크는 현장 지점·영업시간 검증 완료를 뜻하지 않는다.
- 클라우드 설치/시작 설정은 `cloud-environment-onboarding:setup`에 따라 초안으로 저장했다. 환경 설정의 검토·저장 및 환경 게시 전에는 활성화된 것으로 간주하지 않는다.
- GitHub 검토 브랜치는 `codex/senkyo-renewal-r3`다. 푸시로 자동 배포되지 않도록 `vercel.json`의 `git.deploymentEnabled`에서 이 브랜치만 비활성화했다.

## 2026-10-10 추가 수정 · r4

기준 체크아웃: main f486e747. 아래 내용은 이전 2026-10-06~07 기록 이후의 변경이다. 운영 DB 적용·배포·커밋/푸시는 이번 작업에서 실행하지 않았다.

### 단계 A — 예약자료 삭제와 지도 위치 조회

- 예약자료 전체 삭제 확인에 첨부 개수, 모든 일정 연결 제거, 실제 사업자 예약은 취소되지 않음을 표시한다.
- migration 007: 권한·updated_at 검사 후 예약/첨부 메타/연결을 한 transaction에서 삭제한다. 이동 본문은 유지하고 예약 참조만 해제한다. Storage 삭제 작업은 RLS로 보호된 큐에 보존해 실패 후 재시도한다. 일반 data API/REST의 예약 삭제는 차단한다.
- 개별 첨부 삭제 버튼을 해당 파일/텍스트 카드 안으로 옮겼다.
- 지도 원인: 기존 지도는 google_place_id가 있는 장소만 요청했으나 계획의 Place ID는 모두 null이었다. 활성 계획 장소 UUID로 인증 조회한 뒤 저장된 정확한 검색어를 Places API New Text Search에 전달한다. 응답 위치만 번호 핀으로 표시하고 검색 결과임을 안내하며 DB에 좌표를 저장하지 않는다. 미정 체인 지점은 생성하지 않는다.
- 최대 4개씩 조회하며 지도 화면 안에서 성공 결과를 재사용한다. 일부 실패에도 성공한 핀·전체 외부 지도 링크를 유지한다.
- 검증: 권한·충돌·참조 제약 실패 시 전체 롤백, 큐의 RLS, 파일 정리 재시도, Google 요청의 검색어/응답/오류를 로컬 DB·mock·브라우저에서 확인했다. 실제 운영 Google API 성공 검증은 아니다.

### 단계 B — 준비 입력 간소화

- 준비물 폼: 이름·담당자·메모, 선택적인 날짜/연결 일정. 카테고리·필수·정렬·완료·반복 휴대 입력을 제거하며 편집 시 기존 값은 보존한다.
- 할 일 기한 입력/표시 제거. 날짜 선택 시 해당 날짜의 활성 일정만 제공하고 날짜를 바꾸면 맞지 않는 기존 연결을 해제한다. 날짜 미선택 시 일정 선택을 비활성화한다.
- 범위는 연결 일정이 있으면 SCHEDULE, 날짜만 있으면 DATE, 둘 다 없으면 PRE_TRIP/TRIP이다.
- 검증: 추가/수정/완료/삭제, 날짜별 옵션 수·날짜 일치, 선택 해제, 숨긴 입력과 기한 제거를 브라우저에서 확인했다.

### 단계 C — plan.md를 단일 원본으로 전환

- 2026-10-10 사용자 첨부의 6일 113개 시간 행을 plan.md 2026-10-10-r4로 구조화했다. 장소 42개, 자료 슬롯 13개. 미정 지점·열차명·호수는 만들지 않았다.
- 4일차 아메요코 10:30~11:30·우나토토, 5일차 도쿄역·고쿄·스시로 aune 유라쿠초·시바공원·도쿄타워·오다이바, 6일차 우에노공원·Skyliner 10:37~11:25·나리타 T2 반영.
- 1일차 Skyliner 14:42~15:23·우에노→센다이 16:06~18:06, 3일차 센다이→우에노 15:44~17:42도 반영했다. 첨부에 없는 빈 시간의 독립 일정을 생성하지 않았다.
- 기존 TRIP_PLAN은 원본 안내로 바꾸고 r3 원문·seed는 과거 검증 자료로 보존한다. AGENTS/기능 명세/개편안/README의 기준 경로와 요구 충돌을 갱신했다.
- importer는 seed.json/seed.sql과 새 008만 생성한다. 001~006을 수정하지 않았다. 008은 사전 snapshot, 이전 열차 예약 보관, 안정 키 유지, 이동한 일정의 준비 날짜 보정, 사용자 메모/체크 보존 및 재적용을 지원한다. 사용자가 삭제한 새 예약 슬롯은 재생성하지 않는다.
- 검증: 빈 DB의 001~008 설치, r3 사용자 예약/첨부/완료 자료를 넣은 뒤 r4 전환, 재적용과 삭제 슬롯 비부활, 안정 키 및 모든 주요 변경 시각을 확인했다.

### 단계 D — 화면·제안·최종 검증

- 일정 상단에 하루 동선·일정 수·식사 수·숙소와 당일 지도 버튼을 배치했다. 겨울 색상·48px 터치 영역·하단 내비게이션·번호 지도 목록을 정리했다.
- 추가 여행 기능(철도 운행정보, 기상/경보, 일본어 주소 카드, 사전 다운로드 점검)은 이후 사용자 요청에 따라 개발 범위에서 제외했다. 기능 구현은 없다.

| 검증 | 최종 결과 |
|---|---|
| npm run lint | PASS |
| npm run typecheck | PASS |
| npm test | PASS — 38 tests / 4 files |
| npm run build | PASS — Next.js production build |
| npm run test:e2e -- --config /workspace/shared/senkyo-playwright.config.ts | PASS — 17 tests |
| node scripts/import-plan.mjs --check | PASS — 113 schedules / 42 places |
| git diff --check | PASS |
| 화면 | 320/390/768/1280px, 200% 텍스트, 팝업 포커스/스크롤, 새 도쿄 3일 동선 확인 |

브라우저는 테스트 전용 Supabase fixture와 지도 응답 mock을 사용했다. 운영 Supabase/Google/Vercel 접속·DB migration 실행·배포 성공을 의미하지 않는다.

로그·스크린샷: `/workspace/shared/senkyo-r4/`.
적용 안내: [MIGRATION_R4.md](MIGRATION_R4.md). 검토 파일: 007 예약 삭제 구조, 008 최신 여행 계획. 이미 001~006이 적용된 운영 DB는 초기화 없이 이 순서로 적용한다.


### 배포 준비 — 후속 사용자 요청

- 사용자가 운영 migration과 배포를 요청했다. 추가 여행 기능은 제외한다.
- 운영 DB 인증 정보가 없어 사용자가 007→008 SQL을 직접 적용하고 완료를 알리는 방식을 선택했다. 코드 검증 결과는 위와 같으며 준비 중인 코드에는 이후 기능 변경이 없다.
- DB 적용 완료 알림을 받기 전에는 main에 푸시하지 않는다. main 푸시 이후 Vercel 자동 배포를 사용한다.
- 현재 네트워크에서는 운영 사이트/API 접속이 403으로 차단된다. 환경 설정 초안에 접속 도메인을 추가했지만 실행 환경 반영·배포 성공은 아직 확인하지 않았다.
