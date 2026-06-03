-- =============================================================================
-- Business theme: theme_style preset selector
-- =============================================================================

alter table public.businesses
  add column if not exists theme_style text check (
    theme_style is null
    or theme_style in (
      'wellness',
      'beauty',
      'barber',
      'medical',
      'fitness',
      'professional'
    )
  );

comment on column public.businesses.theme_style is
  'Visual identity preset. Works with primary_color and secondary_color overrides.';

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
  theme_style,
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
  'Public branding, theme, and booking fields for active businesses.';

revoke all on public.businesses from anon;
grant select (
  id,
  slug,
  name,
  description,
  logo_url,
  primary_color,
  secondary_color,
  theme_style,
  timezone,
  locale,
  currency,
  status,
  address,
  arrival_instructions,
  payment_methods
) on public.businesses to anon;

grant select on public.business_public to anon, authenticated;
