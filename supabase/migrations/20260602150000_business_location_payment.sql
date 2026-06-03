-- =============================================================================
-- Public booking: business address, arrival instructions, payment methods
-- =============================================================================

alter table public.businesses
  add column if not exists address text check (char_length(address) <= 500),
  add column if not exists arrival_instructions text check (char_length(arrival_instructions) <= 1000),
  add column if not exists payment_methods text check (char_length(payment_methods) <= 1000);

comment on column public.businesses.address is
  'Physical business location shown on public booking confirmation.';
comment on column public.businesses.arrival_instructions is
  'Optional arrival details (floor, entrance, etc.) for public booking.';
comment on column public.businesses.payment_methods is
  'Free-text payment instructions for public booking.';

-- Recreate public view with new columns (security invoker).
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
  status,
  address,
  arrival_instructions,
  payment_methods
from public.businesses
where status = 'active';

comment on view public.business_public is
  'Public branding and booking location/payment fields for active businesses.';

-- Anon: extend column-level SELECT on base table.
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
  status,
  address,
  arrival_instructions,
  payment_methods
) on public.businesses to anon;

grant select on public.business_public to anon, authenticated;
