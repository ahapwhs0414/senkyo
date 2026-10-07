-- Non-destructive schema and authorization changes. No user data is deleted.
alter table public.trips add column plan_version text;
do $$ declare t text; begin
 foreach t in array array['places','schedule_items','transport_segments','reservations','packing_items','checklist_items'] loop
  execute format('alter table public.%I add column plan_key text, add column archived boolean not null default false',t);
  execute format('create unique index on public.%I(trip_id,plan_key) where plan_key is not null',t);
 end loop;
end $$;
alter table public.places add column maps_url text check(maps_url is null or maps_url ~ '^https://(www\.)?google\.com/maps/'), add column verified_on date;
alter table public.schedule_places add column sort_order integer not null default 0, add column archived boolean not null default false;
alter table public.packing_items add column repeat_daily boolean not null default false;
alter table public.checklist_items add column scope text not null default 'TRIP' check(scope in ('PRE_TRIP','TRIP','DATE','SCHEDULE'));
update public.checklist_items set scope=case when schedule_item_id is not null then 'SCHEDULE' when date is not null then 'DATE' else 'PRE_TRIP' end;
alter table public.reservations add column material_only boolean not null default false;
alter table public.reservation_attachments add column description text not null default '';
alter table public.reservation_attachments drop constraint attachment_content;
alter table public.reservation_attachments add constraint attachment_content check (
 (text_content is null or length(btrim(text_content)) between 1 and 10000)
 and ((storage_path is not null and mime_type is not null and size_bytes is not null)
   or (storage_path is null and mime_type is null and size_bytes is null and text_content is not null))
);
create table public.packing_schedule_items (
 id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips,
 packing_item_id uuid not null, schedule_item_id uuid not null,
 unique(trip_id,packing_item_id,schedule_item_id),
 foreign key(trip_id,packing_item_id) references public.packing_items(trip_id,id),
 foreign key(trip_id,schedule_item_id) references public.schedule_items(trip_id,id)
);
create table public.packing_checks (
 id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips,
 packing_item_id uuid not null, date date not null, owner text not null check(owner in ('SHARED','USER_A','USER_B')),
 checked boolean not null default false, updated_at timestamptz not null default now(),
 unique(trip_id,packing_item_id,date,owner),
 foreign key(trip_id,packing_item_id) references public.packing_items(trip_id,id),
 foreign key(trip_id,date) references public.trip_days(trip_id,date)
);
alter table public.packing_schedule_items enable row level security;
create policy read_members on public.packing_schedule_items for select to authenticated using(public.is_member(trip_id));
grant select on public.packing_schedule_items to authenticated;
alter table public.packing_checks enable row level security;
create policy read_members on public.packing_checks for select to authenticated using(public.is_member(trip_id));
create policy edit_members on public.packing_checks for all to authenticated using(public.can_edit(trip_id)) with check(public.can_edit(trip_id));
grant select,insert,update,delete on public.packing_checks to authenticated;
create trigger touch before update on public.packing_checks for each row execute function public.touch_updated_at();
create function public.validate_packing_check() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin
 if not exists(select 1 from packing_items where id=new.packing_item_id and trip_id=new.trip_id and repeat_daily and not archived and owner=new.owner) then
  raise exception 'Daily packing definition/owner mismatch';
 end if; return new;
end $$;
create trigger packing_check_scope before insert or update on public.packing_checks for each row execute function public.validate_packing_check();
create table public.plan_revision_backups (
 trip_id uuid not null, plan_version text not null, captured_at timestamptz not null default now(), snapshot jsonb not null,
 primary key(trip_id,plan_version)
);
alter table public.plan_revision_backups enable row level security;
revoke all on public.plan_revision_backups from public,authenticated;
do $$ declare t text; begin
 foreach t in array array['trip_days','places','schedule_items','transport_segments','schedule_places','meal_candidates','budget_items','expenses'] loop
  execute format('drop policy if exists edit_members on public.%I',t);
  execute format('revoke insert,update,delete on public.%I from authenticated',t);
 end loop;
end $$;
drop policy trip_update on public.trips;
revoke insert,update,delete on public.trips, public.expense_splits from authenticated;
revoke execute on function public.reorder_schedule(uuid,date,uuid[],timestamptz[]) from authenticated,public;
alter publication supabase_realtime add table public.packing_checks;
alter publication supabase_realtime add table public.packing_schedule_items;
-- One transaction creates a non-booking material bundle and its schedule link.
create function public.add_schedule_material(p_trip_id uuid,p_schedule_id uuid,p_reservation_id uuid default null,p_title text default null)
returns uuid language plpgsql set search_path=public,pg_temp as $$
declare material_id uuid;
begin
 if not public.can_edit(p_trip_id) then raise exception 'Editor required' using errcode='42501'; end if;
 if not exists(select 1 from schedule_items where trip_id=p_trip_id and id=p_schedule_id and not archived) then raise exception 'Active schedule required'; end if;
 material_id:=p_reservation_id;
 if material_id is null then
  if length(trim(coalesce(p_title,''))) not between 1 and 200 then raise exception 'Title required'; end if;
  insert into reservations(trip_id,type,title,status,material_only) values(p_trip_id,'OTHER',trim(p_title),'PLANNED',true) returning id into material_id;
 elsif not exists(select 1 from reservations where trip_id=p_trip_id and id=material_id and not archived) then raise exception 'Same-trip reservation required';
 end if;
 insert into reservation_schedule_items(trip_id,reservation_id,schedule_item_id) values(p_trip_id,material_id,p_schedule_id) on conflict(trip_id,reservation_id,schedule_item_id) do nothing;
 return material_id;
end $$;
revoke all on function public.add_schedule_material(uuid,uuid,uuid,text) from public;
grant execute on function public.add_schedule_material(uuid,uuid,uuid,text) to authenticated;
