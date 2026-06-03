-- Allow authenticated users to read their own customer CRM rows (by email match).
-- Complements members-only policies; required for customer portal routing.

drop policy if exists customers_select_self on public.customers;
create policy customers_select_self
  on public.customers for select to authenticated
  using (
    email is not null
    and lower(email) = lower((auth.jwt() ->> 'email'))
  );
