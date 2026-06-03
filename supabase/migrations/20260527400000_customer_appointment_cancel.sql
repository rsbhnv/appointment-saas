-- Allow authenticated customers to cancel their own pending/confirmed appointments.

drop policy if exists appointments_cancel_self on public.appointments;
create policy appointments_cancel_self
  on public.appointments
  for update
  to authenticated
  using (
    status in ('pending', 'confirmed')
    and exists (
      select 1
      from public.customers c
      where c.id = appointments.customer_id
        and c.business_id = appointments.business_id
        and c.email is not null
        and lower(c.email) = lower((select auth.jwt() ->> 'email'))
    )
  )
  with check (
    status = 'cancelled'
    and exists (
      select 1
      from public.customers c
      where c.id = appointments.customer_id
        and c.business_id = appointments.business_id
        and c.email is not null
        and lower(c.email) = lower((select auth.jwt() ->> 'email'))
    )
  );
