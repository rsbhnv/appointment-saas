-- Public booking catalog: anon needs table-level SELECT in addition to RLS policies.
-- platform_schema revokes all from anon; public_booking_policies added policies but not grants.

grant select on public.services to anon;
grant select on public.staff_members to anon;

drop policy if exists app_settings_select_public_booking on public.app_settings;
create policy app_settings_select_public_booking
  on public.app_settings
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'active'
    )
  );

grant select on public.app_settings to anon;
