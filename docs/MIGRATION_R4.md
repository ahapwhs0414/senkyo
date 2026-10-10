# 2026-10-10-r4 적용·검증 안내

운영 DB에는 이 작업에서 접속하거나 변경하지 않았다. 기존 자료를 보존하는 변경이며 초기화 SQL이 아니다.

## 적용 순서

1. Supabase의 DB 백업과 private Storage 파일을 별도로 확보한다. 복원용 DB에서 아래 두 파일을 먼저 검증한다.
2. 기존 001~006이 적용된 프로젝트의 SQL Editor에서 [007](../supabase/migrations/202610080007_reservation_delete.sql) 전체를 실행한다. 삭제 전용 함수·파일 정리 큐·RLS/권한만 만들며 기존 예약을 삭제하지 않는다. 이미 적용했다면 다시 실행하지 않는다.
3. 이어서 [008](../supabase/migrations/202610100008_plan_r4.sql) 전체를 실행한다. 사용자 일정 plan.md에서 생성한 transaction이며 재적용 가능하다. **001~006이나 옛 초기화 SQL을 다시 실행하지 않는다.**
4. 아래 검증 SQL을 실행하고 앱 코드를 반영한다. 지도는 별도로 브라우저 키와 서버용 Places API New 키의 설정이 필요하다.

신규 DB의 순서는 001→002→003→004→005→006→007→008이다. supabase/seed.sql은 008과 동일하며 006 대용이 아니다. Supabase CLI를 사용한다면 프로젝트와 migration 이력을 확인한 뒤 pending migration만 적용한다. 이 문서의 SQL Editor 실행은 CLI 이력을 자동 등록하지 않는다.

```sql
-- 실행 전: r3 또는 이미 적용된 r4가 조회되어야 한다.
select plan_version from public.trips
where id='20261222-2026-4222-8222-202612270002';
select to_regprocedure('public.delete_reservation(uuid,uuid,timestamp with time zone)') as delete_rpc,
       to_regclass('public.reservation_file_deletions') as file_cleanup_queue;

-- 실행 후: r4 / 6일 / 활성 일정 113개.
select plan_version from public.trips
where id='20261222-2026-4222-8222-202612270002';
select count(*) as days from public.trip_days
where trip_id='20261222-2026-4222-8222-202612270002';
select date,count(*) as schedules from public.schedule_items
where trip_id='20261222-2026-4222-8222-202612270002' and not archived
group by date order by date;
-- 날짜별: 18, 19, 22, 15, 22, 17.
select date,title,time_label from public.schedule_items
where trip_id='20261222-2026-4222-8222-202612270002' and not archived
and plan_key in ('d1-skyliner-out','d1-shinkansen-out','d3-shinkansen-return',
'd5-ameyoko','d5-lunch','d6-kokyo','d5-sushiro-lunch','d5-park','d6-skyliner-return')
order by date,sort_order;
select count(*) as pending_file_cleanup from public.reservation_file_deletions;
```

## 보존과 삭제의 구분

- 008은 운영 예약·첨부 파일을 삭제하지 않는다. 기존 열차 자료는 archived로 보관하고 새 Skyliner/우에노 출도착 열차 슬롯을 만든다. 기존 예약번호를 새 열차로 이관하지 않는다.
- 유지되는 방문은 키/UUID를 유지한다. 날짜가 옮겨진 준비 항목은 날짜만 맞추며 체크·담당자·메모를 보존한다. 계획 생성 문구는 이전 seed와 동일한 경우에만 새 문구로 바꾼다.
- 새 슬롯은 첫 r4 적용에서만 생성하므로 사용자가 삭제한 슬롯은 r4 재적용으로 부활하지 않는다. 기존 r3 예약 슬롯이 이미 삭제되어 있어도 생성하지 않는다.
- 앱에서 사용자가 예약 삭제를 확인하면 전용 RPC가 예약·첨부메타·일정 연결을 삭제한다. 이동 일정 본문은 유지한다. 실제 업체 예약은 취소되지 않는다.
- 파일 제거 실패 시 큐가 남는다. 앱의 ‘파일 정리 재시도’ 또는 예약자료의 ‘삭제한 첨부 파일 정리’에서 재시도한다. 이미 발급된 signed URL은 최대 60초 남을 수 있으며 Storage 삭제 전까지 파일은 private bucket에 남는다.

## 복구와 검토

008 적용 직전 자료는 RLS로 보호된 plan_revision_backups의 plan_version='2026-10-10-r4' snapshot에 보관된다. 파일 자체의 백업은 아니다. 적용 오류가 나면 transaction을 롤백하며 일부만 반영하지 않는다. SQL Editor에서 오류 후 같은 탭 transaction이 열린 상태라면 `ROLLBACK;` 후 원인을 확인한다.

과거 `supabase/plan-rollback.sql`은 r3 이전으로 돌리는 파일이므로 r4 복구에 사용하지 않는다. r4 복구는 백업을 별도 DB에 복원해 snapshot과 현재 사용자 수정사항을 비교한 뒤 계획 소유 필드만 되돌린다. 예약 삭제 이후의 실제 파일은 snapshot만으로 복구할 수 없다. 운영 전체 백업을 덮어써 최신 사용자 입력을 잃지 않도록 한다.

001~006의 내용은 변경하지 않는다. plan.md의 후속 여행 변경은 새 버전·새 migration으로 만들며 이미 운영에 적용한 008을 수정하지 않는다.
