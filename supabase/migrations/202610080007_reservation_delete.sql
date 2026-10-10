-- Apply after 001–006. No existing reservations are deleted by this migration.
begin;
create table public.reservation_file_deletions (
 storage_path text primary key,
 trip_id uuid not null references public.trips(id),
 created_at timestamptz not null default now(),
 check(storage_path like trip_id::text || '/%')
);
alter table public.reservation_file_deletions enable row level security;
create policy editors_read on public.reservation_file_deletions for select to authenticated using(public.can_edit(trip_id));
create policy editors_delete on public.reservation_file_deletions for delete to authenticated using(public.can_edit(trip_id));
revoke all on public.reservation_file_deletions from public, authenticated;
grant select,delete on public.reservation_file_deletions to authenticated;
-- The narrow definer operation may clear only this reservation's transport link.
-- A durable queue allows Storage cleanup to be retried after network failures.
create function public.delete_reservation(p_trip_id uuid,p_reservation_id uuid,p_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' as $$
declare current_stamp timestamptz;
begin
 if not public.can_edit(p_trip_id) then raise exception 'Editor required' using errcode='42501'; end if;
 select updated_at into current_stamp from public.reservations where trip_id=p_trip_id and id=p_reservation_id for update;
 if not found then return; end if; -- Retry after successful DB deletion is safe.
 if p_updated_at is null or current_stamp is distinct from p_updated_at then
  raise exception 'Reservation changed' using errcode='40001';
 end if;
 insert into public.reservation_file_deletions(storage_path,trip_id)
 select storage_path,trip_id from public.reservation_attachments where trip_id=p_trip_id and reservation_id=p_reservation_id and storage_path is not null
 on conflict(storage_path) do nothing;
 delete from public.reservation_attachments where trip_id=p_trip_id and reservation_id=p_reservation_id;
 delete from public.reservation_schedule_items where trip_id=p_trip_id and reservation_id=p_reservation_id;
 update public.transport_segments set reservation_id=null where trip_id=p_trip_id and reservation_id=p_reservation_id;
 delete from public.reservations where trip_id=p_trip_id and id=p_reservation_id;
end $$;
revoke all on function public.delete_reservation(uuid,uuid,timestamptz) from public;
grant execute on function public.delete_reservation(uuid,uuid,timestamptz) to authenticated;
-- Direct deletes bypassing the cleanup transaction are no longer allowed.
drop policy edit_members on public.reservations;
create policy insert_members on public.reservations for insert to authenticated with check(public.can_edit(trip_id));
create policy update_members on public.reservations for update to authenticated using(public.can_edit(trip_id)) with check(public.can_edit(trip_id));
revoke delete on public.reservations from authenticated;
notify pgrst, 'reload schema';
commit;
