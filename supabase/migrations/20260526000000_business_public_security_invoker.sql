-- =============================================================================
-- Fix: business_public must not use SECURITY DEFINER (Supabase security advisor).
-- Recreate as SECURITY INVOKER so RLS on public.businesses applies to callers.
-- =============================================================================

drop view if exists public.business_public;

create view public.business_public
with (security_invoker = true)
as
select
  id,
  slug,
  name,
  description,
  logo_url,
  primary_color,
  secondary_color,
  timezone,
  locale,
  currency,
  status
from public.businesses
where status = 'active';

comment on view public.business_public is
  'Public branding fields for active businesses. security_invoker — RLS on businesses applies.';

-- Invoker must pass RLS on the base table (anon has no membership policy).
drop policy if exists businesses_select_public_active on public.businesses;
create policy businesses_select_public_active
  on public.businesses
  for select
  to anon, authenticated
  using (status = 'active');

-- Anon: column-level SELECT only (no direct access to email, phone, etc.).
revoke all on public.businesses from anon;
grant select (
  id,
  slug,
  name,
  description,
  logo_url,
  primary_color,
  secondary_color,
  timezone,
  locale,
  currency,
  status
) on public.businesses to anon;

grant select on public.business_public to anon, authenticated;
