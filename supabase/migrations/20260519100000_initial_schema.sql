-- =============================================================================
-- Phase 1 — Initial schema
--
-- Tables : businesses, business_members, audit_logs
-- Helpers: app.set_updated_at, app.is_member_of, app.is_platform_admin,
--          app.is_reserved_slug, app.normalize_slug
-- View   : public.business_public (slug-based anon read)
--
-- RLS is enabled on every table. Anon role has no direct table access.
-- See docs/rls-strategy.md for the policy patterns and per-PR checklist.
-- =============================================================================

-- ----- Extensions ------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- needed by Phase 3+ exclusion constraints

-- ----- Schemas ---------------------------------------------------------------
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, anon;

-- ----- Enums -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'business_status') then
    create type public.business_status as enum ('active', 'suspended', 'pending_setup');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('business_owner', 'business_admin', 'staff');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type public.member_status as enum ('active', 'invited', 'suspended');
  end if;
end
$$;

-- ----- Helper: set updated_at -------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----- Helper: reserved-slug list --------------------------------------------
-- Source of truth is src/lib/tenant/reserved-slugs.ts; keep this list in sync.
create or replace function app.is_reserved_slug(candidate text)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select lower(candidate) = any (array[
    'api','app','admin','super-admin','dashboard','login','logout','signup',
    'signin','auth','callback','billing','pricing','terms','privacy','support',
    'help','docs','blog','status','health','www','public','static','assets',
    'images','img','files','cdn','mail','email','sms','webhooks','webhook',
    'internal','system','settings','account','accounts','me','my','user','users',
    'business','businesses','customer','customers','staff','service','services',
    'book','booking','bookings','appointment','appointments'
  ]);
$$;

-- ----- Helper: normalize + validate slug (used by trigger) -------------------
create or replace function app.normalize_slug(candidate text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  normalized text;
begin
  if candidate is null then
    raise exception 'invalid_input: slug is required' using errcode = '22023';
  end if;

  normalized := lower(trim(candidate));

  if char_length(normalized) < 2 or char_length(normalized) > 64 then
    raise exception 'invalid_input: slug must be 2-64 characters' using errcode = '22023';
  end if;

  if normalized !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' then
    raise exception 'invalid_input: slug format' using errcode = '22023';
  end if;

  if normalized like '%--%' then
    raise exception 'invalid_input: slug cannot contain consecutive hyphens' using errcode = '22023';
  end if;

  if app.is_reserved_slug(normalized) then
    raise exception 'invalid_input: slug is reserved' using errcode = '22023';
  end if;

  return normalized;
end;
$$;

-- =============================================================================
-- Table: businesses
-- =============================================================================
create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 200),
  slug            text not null,
  industry_type   text,
  description     text check (char_length(description) <= 2000),
  phone           text,
  email           text,
  timezone        text not null default 'Asia/Jerusalem',
  locale          text not null default 'he',
  currency        text not null default 'ILS',
  logo_url        text,
  primary_color   text,
  status          public.business_status not null default 'pending_setup',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint businesses_slug_unique unique (slug)
);

create index if not exists businesses_status_idx on public.businesses (status);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function app.set_updated_at();

create or replace function app.validate_business_slug()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.slug := app.normalize_slug(new.slug);
  return new;
end;
$$;

create trigger businesses_validate_slug
  before insert or update of slug on public.businesses
  for each row execute function app.validate_business_slug();

-- =============================================================================
-- Table: business_members (membership join)
-- =============================================================================
create table if not exists public.business_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.member_role not null default 'staff',
  permissions  jsonb not null default '{}'::jsonb,
  status       public.member_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint business_members_unique unique (business_id, user_id)
);

create index if not exists business_members_user_idx
  on public.business_members (user_id)
  where status = 'active';

create index if not exists business_members_business_idx
  on public.business_members (business_id, status);

create trigger business_members_set_updated_at
  before update on public.business_members
  for each row execute function app.set_updated_at();

-- =============================================================================
-- Table: audit_logs
-- =============================================================================
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references public.businesses(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  action       text not null check (char_length(action) between 1 and 100),
  entity_type  text check (char_length(entity_type) <= 100),
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_business_idx
  on public.audit_logs (business_id, created_at desc);

create index if not exists audit_logs_user_idx
  on public.audit_logs (user_id, created_at desc);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action, created_at desc);

-- =============================================================================
-- RLS helpers (security definer — strict search_path)
-- =============================================================================
create or replace function app.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce(
    (
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'platform_role')
        = 'super_admin'
    ),
    false
  );
$$;

create or replace function app.is_member_of(
  target_business uuid,
  required_roles  public.member_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.business_members m
    where m.business_id = target_business
      and m.user_id     = auth.uid()
      and m.status      = 'active'
      and (required_roles is null or m.role = any (required_roles))
  );
$$;

revoke all on function app.is_platform_admin() from public;
revoke all on function app.is_member_of(uuid, public.member_role[]) from public;
revoke all on function app.is_reserved_slug(text) from public;
revoke all on function app.normalize_slug(text) from public;
revoke all on function app.set_updated_at() from public;
revoke all on function app.validate_business_slug() from public;

grant execute on function app.is_platform_admin() to authenticated, anon;
grant execute on function app.is_member_of(uuid, public.member_role[]) to authenticated;
grant execute on function app.is_reserved_slug(text) to authenticated, anon;

-- =============================================================================
-- Public read view (slug-based, only when business is active)
-- =============================================================================
create or replace view public.business_public as
  select id, slug, name, description, logo_url, primary_color,
         timezone, locale, currency
  from public.businesses
  where status = 'active';

-- =============================================================================
-- Lock down direct table access; expose only what is intended
-- =============================================================================
revoke all on public.businesses        from anon, authenticated;
revoke all on public.business_members  from anon, authenticated;
revoke all on public.audit_logs        from anon, authenticated;

grant select, insert, update, delete on public.businesses       to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select                         on public.audit_logs       to authenticated;
grant select                         on public.business_public  to anon, authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.businesses        enable row level security;
alter table public.business_members  enable row level security;
alter table public.audit_logs        enable row level security;

-- ----- businesses ------------------------------------------------------------
drop policy if exists businesses_select_members on public.businesses;
create policy businesses_select_members
  on public.businesses for select to authenticated
  using (app.is_member_of(id) or app.is_platform_admin());

drop policy if exists businesses_update_owners on public.businesses;
create policy businesses_update_owners
  on public.businesses for update to authenticated
  using      (app.is_member_of(id, array['business_owner']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(id, array['business_owner']::public.member_role[]) or app.is_platform_admin());

drop policy if exists businesses_insert_platform on public.businesses;
create policy businesses_insert_platform
  on public.businesses for insert to authenticated
  with check (app.is_platform_admin());

drop policy if exists businesses_delete_platform on public.businesses;
create policy businesses_delete_platform
  on public.businesses for delete to authenticated
  using (app.is_platform_admin());

-- ----- business_members -----------------------------------------------------
drop policy if exists members_select_self_or_admin on public.business_members;
create policy members_select_self_or_admin
  on public.business_members for select to authenticated
  using (
    user_id = auth.uid()
    or app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[])
    or app.is_platform_admin()
  );

drop policy if exists members_insert_owner on public.business_members;
create policy members_insert_owner
  on public.business_members for insert to authenticated
  with check (
    app.is_member_of(business_id, array['business_owner']::public.member_role[])
    or app.is_platform_admin()
  );

drop policy if exists members_update_owner on public.business_members;
create policy members_update_owner
  on public.business_members for update to authenticated
  using (
    app.is_member_of(business_id, array['business_owner']::public.member_role[])
    or app.is_platform_admin()
  )
  with check (
    app.is_member_of(business_id, array['business_owner']::public.member_role[])
    or app.is_platform_admin()
  );

drop policy if exists members_delete_owner on public.business_members;
create policy members_delete_owner
  on public.business_members for delete to authenticated
  using (
    app.is_member_of(business_id, array['business_owner']::public.member_role[])
    or app.is_platform_admin()
  );

-- ----- audit_logs -----------------------------------------------------------
-- Selects allowed for admins of the same business and platform admins.
-- No insert/update/delete policy: writes happen via the service role only.
drop policy if exists audit_select_admins on public.audit_logs;
create policy audit_select_admins
  on public.audit_logs for select to authenticated
  using (
    (
      business_id is not null
      and app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[])
    )
    or app.is_platform_admin()
  );

-- =============================================================================
-- Comments (documentation)
-- =============================================================================
comment on table public.businesses        is 'Tenant root. One row per business in the SaaS.';
comment on table public.business_members  is 'Many-to-many between auth.users and businesses with role + permissions.';
comment on table public.audit_logs        is 'Append-only system log. Service-role writes only.';
comment on function app.is_member_of(uuid, public.member_role[]) is
  'True when auth.uid() has an active membership in the target business, optionally restricted by role.';
comment on function app.is_platform_admin() is
  'True when JWT app_metadata.platform_role = super_admin. Claim is server-set only.';
comment on function app.is_reserved_slug(text) is
  'Reserved slug list, mirrored from src/lib/tenant/reserved-slugs.ts.';
