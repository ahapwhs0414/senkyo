# AGENTS.md — senkyo 冬の旅

## 기준과 범위

- 여행 데이터: `docs/TRIP_PLAN.md` **2026-10-06-r3**.
- 기능·디자인: `docs/SENKYO_RENEWAL_PLAN.md`. 구현 계약은 `docs/FUNCTIONAL_SPEC.md`.
- 사용자 지시가 우선이다. 두 문서의 담당 범위를 섞지 않는다.
- 기존 체크아웃을 사용한다. 사용자가 요청하지 않으면 worktree를 만들지 않는다.
- 운영 DB 삭제, 자동 migration 적용, Vercel 배포는 이번 개편 범위에 없다.

## 제품

사전에 계획한 여행을 조회하고 예약자료와 준비 상태를 함께 관리한다.
하단 메뉴는 오늘 / 일정 / 지도 / 준비 / 더보기다.
계획 본문(일정·순서·시간·장소·이동·고정 식당)은 SELECT만 가능하다.
지출·정산·후보 식당 관리 및 계획 편집 UI/API/DB 쓰기는 제공하지 않는다.
쇼핑·긴급정보·메모, 예약/첨부, 준비물/할 일 작성과 체크는 유지한다.

## 인증·보안

- 사용자 제공 값으로 사전 생성한 정확히 두 계정; username/password UI; signup 없음.
- 비밀번호 평문 저장·임의 계정·클라이언트 서버 키 노출 금지.
- 여행별 RLS, 동일 여행 복합 FK, private `reservation-files` bucket을 유지한다.
- PDF/PNG/JPEG/WEBP만, 최대 10MB, 실제 파일 서명 검사. 텍스트 최대 10,000자, HTML 실행 금지.
- 파일 링크는 매번 60초 signed URL을 재발급한다. 인증 API·첨부는 SW 캐시 금지.
- 예약번호·QR·좌석·확인 URL·보험번호는 사용자 입력 전 null이다.
- 원본 사업자 앱·동적 QR 필요성을 정적 첨부로 대체했다고 안내하지 않는다.
- secret 값은 채팅·로그·문서·공개 저장소에 남기지 않는다.

## 계획 변경과 보존

`scripts/import-plan.mjs`는 명시적 표와 `scripts/plan/legacy-ids.json`으로 안정 UUID를 생성한다.
날짜·제목·배열 위치로 운영 ID를 새로 만들지 않는다. 예상 시간을 자동 교체하지 않는다.
폐기 일정/옛 숙소는 archived로 보관한다. 사용자 예약·첨부·메모·기존 준비물·체크 상태를 덮어쓰거나 cascade 삭제하지 않는다.
옛 칸데오 예약을 새 APA 우에노 예약으로 옮기지 않는다.
운영 반영 전 백업, 사전 영향 조회, 검토, transaction, 재적용·롤백 검증이 필요하다.
자세한 적용 순서는 `docs/MIGRATION_R3.md`를 따른다.

## 준비와 시간

- 물건/자료는 packing_items, 행동은 checklist_items로 분리한다.
- PRE_TRIP은 여행 전체에서 한 번 완료하고 날짜 집계에서 제외한다.
- 짐 싸기 `checked`와 일별 휴대 `packing_checks`는 분리한다.
- 일별 체크는 (항목 ID, 날짜, 담당자) 유일성; 공동/개인 항목을 이름으로 병합하지 않는다.
- 공통 항목의 일정 연결은 packing_schedule_items, 일정 추가 항목은 schedule_item_id로 연결한다.
- 오늘 전체보기는 같은 날짜 팝업; 탭·스크롤·포커스 보존, ESC·배경 닫기·포커스 고정.
- 일본 일정은 Asia/Tokyo, 날짜는 date-only, 금액 참고값은 정수 엔. 미확정 식사는 현재/다음 자동 계산에서 제외한다.

## 지도와 디자인

- 계획서 Google Maps 검색 링크는 API 키 없이 독립적으로 동작한다. 확인되지 않은 Place ID·좌표·지점은 만들지 않는다.
- 내장 지도는 부가 기능. 키 없음·인증 실패·지점 없음·부분 실패를 구분하고 고정 목록을 항상 유지한다.
- `#F5F7F9` 바탕, 흰 카드, `#175D4B` 주요 버튼, 작은 겨울/크리스마스 배지.
- Pretendard 로컬 폰트와 시스템 대체 글꼴, 16px 본문, 44px 이상 터치 영역.
- 로그인부터 모든 화면/폼/오류/팝업에 같은 테마. prefers-reduced-motion을 존중한다.
- 320/390/768/1280px, 긴 지점명·예약번호, 200% 확대, 키보드 포커스를 확인한다.

## 작업과 검증

문서 → 관련 코드 → 최소 변경 → lint → typecheck → test → build → 관련 화면 → 변경 검토 순으로 진행한다.
존재하지 않는 script를 임의 실행하지 않는다. 실행하지 않은 검증을 PASS로 쓰지 않는다.

```bash
npm ci
npx --no-install next typegen
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
node scripts/import-plan.mjs --check
```

클라우드 이미지의 Chromium은 저장소 밖 config로 사용 가능:
`npm run test:e2e -- --config /workspace/shared/senkyo-playwright.config.ts`.
PGlite는 migration·권한·기존 자료 보존을 검증하고 E2E는 test-only fixture를 사용한다.
운영 Google/Supabase 성공으로 간주하지 않는다. 단계별 변경/검증은 `docs/RENEWAL_CHANGELOG.md`에 남긴다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
