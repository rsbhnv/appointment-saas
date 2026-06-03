-- Public catalog read + customer self-service booking (no slot engine).

drop policy if exists services_select_public_active on public.services;
create policy services_select_public_active
  on public.services for select to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active'
    )
  );

drop policy if exists staff_select_public_active on public.staff_members;
create policy staff_select_public_active
  on public.staff_members for select to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active'
    )
  );

drop policy if exists customers_insert_self on public.customers;
create policy customers_insert_self
  on public.customers for insert to authenticated
  with check (
    email is not null
    and lower(email) = lower((auth.jwt() ->> 'email'))
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active'
    )
  );

drop policy if exists appointments_select_self on public.appointments;
create policy appointments_select_self
  on public.appointments for select to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = customer_id
        and lower(c.email) = lower((auth.jwt() ->> 'email'))
    )
  );

drop policy if exists appointments_insert_customer on public.appointments;
create policy appointments_insert_customer
  on public.appointments for insert to authenticated
  with check (
    exists (
      select 1 from public.customers c
      where c.id = customer_id
        and c.business_id = appointments.business_id
        and lower(c.email) = lower((auth.jwt() ->> 'email'))
    )
    and exists (
      select 1 from public.services s
      where s.id = service_id
        and s.business_id = appointments.business_id
        and s.active = true
    )
    and exists (
      select 1 from public.staff_members st
      where st.id = staff_member_id
        and st.business_id = appointments.business_id
        and st.active = true
    )
  );
