create table public.schedule_places (
 id uuid primary key default gen_random_uuid(),
 trip_id uuid not null references public.trips on delete cascade,
 schedule_item_id uuid not null,
 place_id uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(trip_id,schedule_item_id,place_id),
 foreign key(trip_id,schedule_item_id) references public.schedule_items(trip_id,id) on delete cascade,
 foreign key(trip_id,place_id) references public.places(trip_id,id)
);
alter table public.schedule_places enable row level security;
create policy read_members on public.schedule_places for select to authenticated using(public.is_member(trip_id));
create policy edit_members on public.schedule_places for all to authenticated using(public.can_edit(trip_id)) with check(public.can_edit(trip_id));
grant select,insert,update,delete on public.schedule_places to authenticated;
create trigger touch before update on public.schedule_places for each row execute function public.touch_updated_at();
create index on public.schedule_places(trip_id,schedule_item_id);
alter publication supabase_realtime add table public.schedule_places;

create function public.append_schedule() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if auth.uid() is not null and (TG_OP='INSERT' or new.date is distinct from old.date) then
  perform pg_advisory_xact_lock(hashtextextended(new.trip_id::text || new.date::text,0));
  select coalesce(max(sort_order)+1,0) into new.sort_order from schedule_items where trip_id=new.trip_id and date=new.date and id<>new.id;
 end if;
 return new;
end $$;
create trigger append_schedule before insert or update of date on public.schedule_items for each row execute function public.append_schedule();

create function public.reorder_schedule(p_trip_id uuid,p_date date,p_ids uuid[],p_versions timestamptz[]) returns void language plpgsql set search_path=public,pg_temp as $$
declare total integer;
begin
 if not public.can_edit(p_trip_id) then raise exception 'Editor required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_trip_id::text || p_date::text,0));
 select count(*) into total from schedule_items where trip_id=p_trip_id and date=p_date;
 if coalesce(cardinality(p_ids),0)<>total or cardinality(p_versions) is distinct from total
   or (select count(distinct id) from unnest(p_ids) id)<>total then raise exception 'Schedule changed' using errcode='40001'; end if;
 perform 1 from schedule_items where trip_id=p_trip_id and date=p_date for update;
 if (select count(*) from unnest(p_ids,p_versions) t(id,version) join schedule_items s on s.id=t.id and s.updated_at=t.version where s.trip_id=p_trip_id and s.date=p_date)<>total then raise exception 'Schedule changed' using errcode='40001'; end if;
 update schedule_items s set sort_order=t.position-1 from unnest(p_ids) with ordinality t(id,position) where s.id=t.id and s.trip_id=p_trip_id and s.date=p_date;
end $$;
revoke all on function public.reorder_schedule(uuid,date,uuid[],timestamptz[]) from public;
grant execute on function public.reorder_schedule(uuid,date,uuid[],timestamptz[]) to authenticated;
