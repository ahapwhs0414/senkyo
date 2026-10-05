-- Validate data even when a member uses the Supabase API directly.
alter table public.schedule_items add check(type in ('FLIGHT','TRAIN','TRANSIT','HOTEL','ATTRACTION','MEAL','SHOPPING','WALK','FREE_TIME','OTHER'));
alter table public.places add check(category in ('RESTAURANT','CAFE','ATTRACTION','HOTEL','SHOPPING','STATION','AIRPORT','OTHER'));
alter table public.reservations add check(type in ('FLIGHT','HOTEL','TRAIN','BUS','SHUTTLE','ATTRACTION','RESTAURANT','INSURANCE','OTHER'));
alter table public.reservations add check(start_at is null or end_at is null or end_at>=start_at);
alter table public.transport_segments add check(transport_type in ('WALK','TRAIN','SUBWAY','BUS','SHINKANSEN','AIRPORT_EXPRESS','FLIGHT','SHUTTLE','TAXI','OTHER'));
alter table public.meal_candidates add check(priority between 0 and 10);
alter table public.meal_candidates add check(not visited or meal_schedule_id is not null);
alter table public.checklist_items add check(priority between 0 and 10);
alter table public.expenses add check(
 (split_mode='EQUAL' and share_a_yen=(amount+1)/2 and share_b_yen=amount/2)
 or (split_mode='USER_A_ONLY' and share_a_yen=amount and share_b_yen=0)
 or (split_mode='USER_B_ONLY' and share_a_yen=0 and share_b_yen=amount)
 or split_mode='CUSTOM'
);
alter table public.reservations add check(website_url is null or website_url='' or website_url ~ '^https?://');
alter table public.reservations add check(booking_url is null or booking_url='' or booking_url ~ '^https?://');
alter table public.reservations add check(confirmation_url is null or confirmation_url='' or confirmation_url ~ '^https?://');
alter table public.emergency_contacts add check(url is null or url='' or url ~ '^https?://');
alter table public.transport_segments add unique(trip_id,schedule_item_id);
create trigger transport_scope before insert or update on public.transport_segments for each row execute function public.validate_scope();
-- Explicit grants complement RLS. Membership and profiles are provisioned outside the app.
grant usage on schema public to authenticated;
grant select on public.profiles,public.trip_members to authenticated;
grant select,update on public.trips to authenticated;
grant select,insert,update,delete on public.trip_days,public.schedule_items,public.transport_segments,public.places,public.meal_candidates,public.packing_items,public.checklist_items,public.reservations,public.reservation_attachments,public.reservation_schedule_items,public.budget_items,public.expenses,public.shopping_items,public.emergency_contacts,public.notes to authenticated;
grant select on public.expense_splits to authenticated;
-- Seed rows precede account provisioning, so creator is nullable only for those rows.
alter table public.places add column created_by uuid references public.profiles default auth.uid();
alter table public.reservations add column created_by uuid references public.profiles default auth.uid();
alter table public.notes add column created_by uuid references public.profiles default auth.uid();
alter table public.expenses add column created_by uuid references public.profiles default auth.uid();
alter table public.reservation_attachments add check(storage_path like trip_id::text || '/' || reservation_id::text || '/%');
