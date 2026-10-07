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
