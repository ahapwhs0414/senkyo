# AGENTS.md — Japan Trip Planner Codex Harness

## 1. 프로젝트 목적

두 명이 2026-12-22 ~ 2026-12-27 일본 여행을 공동 관리하는 모바일 우선 웹앱을 구축한다.

Source of truth 우선순위:

1. `FUNCTIONAL_SPEC.md`
2. `TRIP_PLAN.md`
3. `AGENTS.md`

명세와 구현이 충돌하면 위 순서를 따른다.

---

# 2. 사용자 모델 — 매우 중요

이 서비스는 현재 정확히 2개의 사전 생성 계정만 사용한다.

회원가입 기능을 구현하지 않는다.

로그인 UI:

- 아이디
- 비밀번호

사용자에게 email 로그인을 노출하지 않는다.

인증 구현은 Supabase Auth 등 안전한 시스템을 사용해도 되지만 UI는 username/password 방식이어야 한다.

금지:

- 평문 password DB 저장
- 소스코드에 password 하드코딩
- 클라이언트 번들에 credential 포함
- 공개 signup endpoint
- 임의 계정 생성 UI

Seed 또는 배포 단계에서 두 계정을 생성하는 안전한 절차를 문서화한다.

실제 아이디/비밀번호가 사용자에게서 제공되지 않았다면 임의 값을 만들지 말고 placeholder 또는 설정 절차만 구현한다.

---

# 3. 핵심 제품 원칙

이 앱은 단순 여행 일정표가 아니다.

현지에서 앱 하나로 다음을 확인할 수 있어야 한다.

- 오늘 어디를 가는가
- 몇 시에 출발해야 하는가
- 어떤 교통수단을 타는가
- 얼마 정도 드는가
- 어디서 타고 어디서 내리는가
- 예약이 필요한가
- 예약번호는 무엇인가
- 예약 사이트 / 확인 링크는 어디인가
- 그 일정에 무엇을 챙겨야 하는가
- 아직 안 챙긴 것이 있는가
- 식사는 어디 후보 중 고를 것인가
- 오늘 얼마를 썼는가
- 서로 얼마를 정산해야 하는가

---

# 4. 권장 기술

- Next.js
- TypeScript
- App Router
- Tailwind
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Google Maps JavaScript API
- Google Places API New
- Google Maps URLs
- Vercel

기존 저장소가 이미 다른 호환 구조라면 합리적인 범위에서 기존 구조를 유지한다.

---

# 5. Codex 작업 루프

모든 작업은 다음 순서를 따른다.

1. 관련 명세 읽기
2. 관련 코드 읽기
3. 최소 변경 범위 결정
4. 구현
5. lint
6. typecheck
7. 테스트
8. build
9. 변경 내용 검토
10. 필요한 문서 업데이트

프로젝트에 존재하지 않는 script는 억지로 실행하지 않는다.

한 단계가 실패하면 원인을 해결하고 다음 단계로 넘어간다.

---

# 6. 초기 개발 순서

1. scaffold 점검
2. 환경변수 예제
3. Supabase 연결
4. DB migration
5. RLS
6. 두 계정 로그인
7. Seed 데이터
8. 오늘 화면
9. 전체 일정
10. 일정 상세
11. transport segment
12. 준비물
13. 체크리스트
14. 예약 허브
15. 예약 첨부파일
16. Google Places
17. 후보 식당
18. 지도 / Google Maps 링크
19. 예산
20. 지출 / 정산
21. 쇼핑
22. 긴급정보
23. Realtime
24. PWA
25. Production 검증

---

# 7. DB 권장 구조

```text
profiles

trips
trip_members
trip_days

schedule_items
transport_segments

places
meal_candidates

packing_items
checklist_items

reservations
reservation_attachments
reservation_schedule_items

budget_items
expenses
expense_splits

shopping_items

emergency_contacts
notes
```

모든 여행 종속 데이터는 RLS 판단 가능한 `trip_id` 또는 여행까지 연결되는 FK를 가져야 한다.

---

# 8. 여행 Seed

`TRIP_PLAN.md`의 모든 일정과 준비정보를 초기 데이터로 Seed 한다.

Seed 대상:

- 6일 일정
- 교통편
- 예상 교통비
- 숙소
- 관광지
- 우마미 타스케
- 전체 준비물
- 날짜별 준비물
- 일정별 준비물
- 체크리스트
- 예약 placeholder

절대 가짜 데이터를 만들지 말아야 하는 필드:

- 실제 예약번호
- 실제 QR
- 실제 좌석번호
- 실제 확인 URL
- 보험 증권번호

사용자가 입력할 때까지 null.

Seed는 가능하면 idempotent하게 한다.

---

# 9. 예약 구현 — 중요

예약 유형:

- FLIGHT
- HOTEL
- TRAIN
- BUS
- SHUTTLE
- ATTRACTION
- RESTAURANT
- INSURANCE
- OTHER

필수 지원 필드:

```text
title
provider
reservation_number
booker_name
start_at
end_at
website_url
booking_url
confirmation_url
contact_phone
contact_email
status
note
```

확장 메타데이터가 필요하면 JSONB 남발보다 명시적 필드를 우선하되, 타입별 특수 필드는 합리적으로 설계한다.

사용자가 직접 URL을 추가/수정할 수 있어야 한다.

URL 검증을 한다.

---

# 10. 예약 첨부

Supabase Storage private bucket 사용.

예:

- PDF
- PNG
- JPG
- WEBP

권한:

- 두 인증 사용자만 접근
- public URL 사용 금지
- signed URL 또는 인증 접근

파일 업로드 시:

- 확장자만 믿지 말 것
- MIME type 확인
- 파일 크기 제한
- 사용자에게 오류 제공

---

# 11. 준비물 / 체크리스트

둘은 분리한다.

Packing item:
실제로 챙겨야 하는 물건/정보.

Checklist:
사용자가 해야 할 행동.

예:

Packing:
- 여권
- 장갑

Checklist:
- 사칸 셔틀 예약 확인
- 10:23 버스 시간 캡처

Scope:

- trip
- date
- schedule item

UI에서 scope가 자연스럽게 합쳐져 오늘 필요한 내용을 보여줘야 한다.

---

# 12. 오늘 화면 계산

오늘 화면은 여행 중 핵심 화면이다.

해당 날짜 기준으로 다음을 aggregate 한다.

- schedule_items
- transport_segments
- packing_items
- checklist_items
- reservations
- expenses
- meal_candidates

표시 우선순위:

1. 지금/다음 일정
2. 시간 고정 교통
3. 미완료 중요 체크
4. 오늘 필요한 예약
5. 준비물
6. 식사
7. 지출

---

# 13. 식당 구현

자동 추천하지 않는다.

Places 검색 → 사용자가 선택 → Place ID 저장.

사용자 데이터:

- note
- tags
- priority
- favorite
- meal link

Google 데이터는 가능한 경우 실시간/정책 준수 캐시.

메뉴와 개별 가격을 항상 제공한다고 가정하지 않는다.

---

# 14. 지도 / 길찾기

자체 turn-by-turn 내비게이션을 구현하지 않는다.

Google Maps URL로 연결.

확정 교통편의 예약 시간은 DB가 source of truth.

Google Maps 추천 시간으로 Hayabusa, N'EX, 사칸 셔틀 예약시간을 자동 변경하지 않는다.

---

# 15. 시간

여행 timezone:

`Asia/Tokyo`

DB:

- 날짜는 `YYYY-MM-DD`
- datetime은 timezone-aware 형태 권장

UI에서 일본 여행 일정은 일본 현지시간으로 표시.

브라우저가 한국시간이어도 날짜가 하루 밀리지 않도록 date-only 처리에 주의.

---

# 16. 금액

JPY 금액은 integer yen.

floating point 금지.

예상비용과 실제비용 분리.

범위 비용을 표시해야 한다면:

```text
estimated_cost_min_yen
estimated_cost_max_yen
```

같이 명시적으로 모델링하는 것을 선호한다.

---

# 17. TypeScript

- `any` 최소화
- DB type과 Google response type 분리
- Server/Client boundary 명확히
- validation 사용
- nullable 의미 명확히

외부 입력:

- URL
- 숫자
- 날짜
- 파일
- 검색 query

모두 검증한다.

---

# 18. UI

모바일 우선.

최소 320px에서 핵심 UI 사용 가능.

주요 터치 target 약 44px 이상.

홈 하단:

- 오늘
- 일정
- 지도
- 장소
- 더보기

예약번호 등 긴 문자열은 overflow 처리하고 복사 버튼 제공 가능.

색상만으로 상태를 표현하지 않는다.

---

# 19. 에러 상태

Places 실패:
- 사용자 저장 메모/이름 유지
- 재시도 제공

예약 파일 실패:
- 업로드 실패 명확히 표시
- DB에 성공한 척 저장 금지

Realtime 실패:
- 로컬 UI가 영구 성공상태처럼 보이지 않도록 처리

---

# 20. 로딩 / 중복 제출

다음 작업은 saving 상태 제공:

- 일정
- 후보 식당
- 체크리스트
- 준비물
- 예약
- 첨부
- 지출
- 쇼핑

저장 중 primary action disable.

---

# 21. 빈 상태

모든 주요 목록에는 행동 가능한 empty state.

예:

```text
등록된 예약정보가 없습니다.
항공권, 숙소, 열차 예약번호나 확인 링크를 추가해두면 여행 중 빠르게 확인할 수 있습니다.

[예약 추가]
```

---

# 22. 보안

필수:

- RLS
- private Storage
- server secret browser 금지
- `.env.local` gitignore
- `.env.example`
- Google key restriction
- input validation
- XSS 방지
- unsafe HTML 금지

---

# 23. 권한

두 계정 모두 기본적으로 EDITOR.

단, 필요하면 한 계정을 OWNER로 설정.

비회원 접근 차단.

현재는 외부 초대 기능 불필요.

---

# 24. 테스트 우선순위

## Auth

- 올바른 사용자 로그인
- 잘못된 비밀번호 실패
- 회원가입 route 없음
- 비로그인 보호 route 접근 실패

## 여행

- Seed 일정 표시
- 오늘 일정 계산
- 날짜 전환

## 준비

- trip packing
- date packing
- schedule packing
- 완료 상태

## 예약

- 예약 생성
- 예약번호 수정
- URL 추가
- 일정 연결
- 첨부 업로드
- 권한 검사

## 비용

- 합산
- 2인 정산
- custom split

## Places

- 검색
- 저장
- 오류 fallback

---

# 25. 검증 명령

프로젝트 실제 scripts에 맞춘다.

일반적으로:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

실패하면 완료라고 보고하지 않는다.

---

# 26. Definition of Done

각 기능:

1. 요구사항 충족
2. 모바일 사용 가능
3. loading/error/empty state
4. 권한 적용
5. TypeScript 정상
6. lint pass
7. 관련 test pass
8. production build pass
9. 필요한 migration/seed/doc 갱신

---

# 27. 작업 완료 보고

```text
변경
- ...

검증
- npm run lint: PASS
- npm run typecheck: PASS
- npm test: PASS
- npm run build: PASS

남은 일 / 주의
- ...
```

실행하지 않은 검증을 PASS라고 작성하지 않는다.

---

# 28. 구현 시 절대 놓치지 말 것

- 2개 계정만 로그인
- signup 없음
- 준비물 3단계 scope
- checklist 별도
- 예약번호 직접 입력
- 예약사이트 / 확인 URL 직접 입력
- 예약 첨부
- 일정 ↔ 예약 연결
- 고정 교통 시간 보존
- Google Maps redirect
- 후보 식당 직접 등록
- 공동 지출 / 정산
- 긴급정보
- 모바일 여행 중 사용성

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
