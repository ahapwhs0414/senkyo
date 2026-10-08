-- Read-only preflight for the existing schema (before 005/006).
-- Run in an authorized SQL editor and save the result privately.
begin read only;
select id,title,start_date,end_date from public.trips where id='20261222-2026-4222-8222-202612270002';
select 'schedules' as kind,count(*) from public.schedule_items where trip_id='20261222-2026-4222-8222-202612270002'
union all select 'reservations',count(*) from public.reservations where trip_id='20261222-2026-4222-8222-202612270002'
union all select 'attachments',count(*) from public.reservation_attachments where trip_id='20261222-2026-4222-8222-202612270002'
union all select 'packing',count(*) from public.packing_items where trip_id='20261222-2026-4222-8222-202612270002'
union all select 'checklists',count(*) from public.checklist_items where trip_id='20261222-2026-4222-8222-202612270002';
select s.id,s.date,s.title,
 (select count(*) from public.reservation_schedule_items l where l.schedule_item_id=s.id) as reservation_links,
 (select count(*) from public.packing_items p where p.schedule_item_id=s.id) as packing_links,
 (select count(*) from public.checklist_items c where c.schedule_item_id=s.id) as task_links
from public.schedule_items s where s.trip_id='20261222-2026-4222-8222-202612270002' order by date,sort_order;
-- Deliberately exclude booking numbers, text, signed URLs and credentials from this report.
commit;
