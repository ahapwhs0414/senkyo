# 2026-10-06-r3 적용·검토 절차

이번 작업은 파일과 로컬 PGlite 검증만 수행한다. 운영 DB·Storage·Vercel에는 적용하지 않는다.

## 1. 적용 전

1. 앱 쓰기를 잠시 중단할 수 있는 점검 시간을 정한다. DB 전체 백업과 private Storage 객체 백업을 확보하고 복원 가능성을 시험한다.
2. 기존 migration 001~004 적용 여부를 확인한다. 미적용 migration은 별도로 검토한다. 005를 중복 실행하지 않는다.
3. 읽기 전용 `supabase/plan-preflight.sql`로 전체 일정/자료/첨부/준비 개수와 관련 관계를 확인한다. 운영 예약번호·파일·텍스트를 공개 로그에 출력하지 않는다.
4. `scripts/plan/legacy-ids.json`의 기존 UUID가 운영 seed UUID와 맞는지 확인한다. 운영에서 다른 ID로 도입한 계획이 있다면 파일의 매핑을 검토·추가하고 출력을 다시 생성해야 한다. 이름만으로 자동 병합하지 않는다.
5. 갱신/신규/보관 목록은 `scripts/plan/legacy-seed.json`과 `src/lib/seed.json` 및 generated 006 SQL diff로 검토한다. legacy 파일은 최초 저장소 seed이며 운영 개인정보를 포함하지 않는다.
6. 복원한 임시 DB에 005/006을 적용하고 사용자 예약번호·좌석·텍스트/파일 연결·체크 상태·사용자 항목의 전후 차이를 확인한다.

## 2. 순서

- 신규 DB: 202610050001 → 002 → 003 → 004 → **202610060005_renewal_schema.sql** → **202610060006_plan_r3.sql**. seed.sql은 같은 계획 transaction이므로 재적용 가능하다.
- 기존 DB(001~004 적용됨): 005(schema·권한·일별 체크·자료 RPC·snapshot 테이블), 이어서 006(계획 갱신 transaction).
- 005는 migration 관리 도구로 한 번 적용한다. 006/seed.sql은 idempotent data import다.
- SQL은 관리 권한으로 적용하고 공개 anon 또는 일반 authenticated 계정으로 적용하지 않는다.
- 006은 transaction과 advisory lock을 사용한다. 실패하면 transaction 전체를 rollback하며 부분 적용을 완료로 취급하지 않는다.

## 3. 보존 계약

- 일정/장소/이동의 안정 키는 기존 UUID 매핑을 우선 사용한다.
- 계획 소유 필드만 upsert. 일정 사용자 note/status, 확인된 Place ID, 기존 이동 예약 연결/티켓 메모는 덮어쓰지 않는다.
- 기존 예약 title/번호/좌석/상태/확인 URL/텍스트/첨부는 그대로 유지한다. 기존 reservation_schedule_items 링크도 삭제하지 않는다.
- 칸데오 예약은 archived로 보관하고 APA 우에노 예약은 별도 빈 슬롯이다. 옛 호텔 체크인/체크아웃 일정도 보관하여 자동 오인 연결을 막는다.
- 제거 일정·장소·이동, 명시적으로 폐기한 비용/후보/옛 숙소 seed 준비 항목만 archived 처리한다. 그 외 기존 날짜별/일정별/사용자 작성 준비 항목과 완료 상태를 유지한다.
- 사용자 항목이 제거 일정에 연결돼 있으면 상세/당일 집계에서 제외하고 보관 화면에서 조회·관리할 수 있다.
- 기존 meal_candidates는 삭제하지 않는다. 현재 r3 식사 연결은 명시적 schedule_places로 구성하고 옛 후보를 활성 목록에 섞지 않는다.
- 원래 checked와 checklist.status는 바꾸지 않는다. repeat_daily 준비 정의의 새 packing_checks는 비어 있으며 짐 싸기 완료를 당일 휴대 완료로 복제하지 않는다.
- 기존 expenses/expense_splits/budget_items는 삭제하지 않고 쓰기를 차단한다. 새 클라이언트는 조회하지 않는다.
- 첫 006 실행 전에 plan_revision_backups에 관계·개인 자료 포함 비공개 snapshot을 저장한다. 재실행은 최초 snapshot을 덮어쓰지 않는다.

## 4. 적용 후 확인

활성 일정 108개, r3 계획 버전, 수족관 10:00~13:00, 셔틀 15:30~16:15, APA 우에노 3박과 새 고정 식당을 확인한다.
옛 호텔/아라하마는 활성 집계에 없어야 하며 보관 자료는 남아 있어야 한다.
일반 EDITOR 계정으로 일정·장소·비용 직접 쓰기 및 reorder RPC가 거절되고 준비/자료 편집은 성공해야 한다.
두 계정으로 일별 체크, PRE_TRIP, 텍스트/파일/혼합 업로드 및 signed URL 재발급을 확인한다.
새 build에 환경값이 들어가야 하므로 적용할 코드 버전과 migration 순서를 조율한다. 여기서는 배포하지 않는다.

## 5. 비파괴 롤백

복원한 임시 DB에서 `supabase/plan-rollback.sql`을 먼저 시험한다. pre-renewal 일정 snapshot이 없는 신규 DB에서는 실행을 거절한다.
계획 필드와 archive 상태만 되돌리고 새 계획 행/준비 정의는 보관한다. 예약/파일/개인 note/완료 상태는 되돌리거나 삭제하지 않는다.
005의 schema와 읽기 전용 권한은 유지한다. 구형 편집 기능 복원은 별도 검토 없이는 하지 않는다.
롤백 후 계획 버전은 원래 값(null 가능)이므로 해당 코드/명세와 조율해야 한다. SQL 실행 자체가 배포를 뜻하지 않는다.
개인 자료까지 과거 시점으로 되돌리는 복원은 이 절차의 범위가 아니다. 필요하면 따로 승인받고 전체 DB+Storage 백업으로 검토한다.

## 6. 재생성

`node scripts/import-plan.mjs`는 명시적 Markdown 표를 변환하여 seed.json, seed.sql, 006 SQL을 쓴다.
`node scripts/import-plan.mjs --check`는 출력 일치만 확인하고 DB에 접속하지 않는다.
새 계획 버전을 만들 때 이미 적용된 migration 파일을 수정하지 않고 별도 version과 신규 migration으로 확장해야 한다.
