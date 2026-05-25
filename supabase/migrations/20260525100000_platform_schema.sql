-- =============================================================================
-- Phase 2 — Full platform schema
-- Tenant-scoped tables include business_id. Rule-based availability + slot_overrides.
-- No materialized future slots. Appointment overlap prevented via exclusion constraint.
-- =============================================================================

-- ----- Sync reserved slugs (add preview) -----------------------------------
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
    'book','booking','bookings','appointment','appointments','preview'
  ]);
$$;

-- ----- Enums -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum (
      'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type public.notification_channel as enum ('email', 'sms', 'whatsapp', 'push');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('queued', 'sent', 'failed', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'trialing', 'active', 'past_due', 'cancelled', 'paused'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'slot_override_type') then
    create type public.slot_override_type as enum ('block', 'open');
  end if;
end
$$;

-- ----- businesses: branding column -------------------------------------------
alter table public.businesses
  add column if not exists secondary_color text;

-- =============================================================================
-- locations
-- =============================================================================
create table if not exists public.locations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 200),
  address_line text,
  city         text,
  timezone     text,
  phone        text,
  is_primary   boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists locations_business_idx
  on public.locations (business_id, active);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function app.set_updated_at();

-- =============================================================================
-- staff_members
-- =============================================================================
create table if not exists public.staff_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  name         text not null check (char_length(name) between 1 and 200),
  title        text,
  phone        text,
  email        text,
  color        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists staff_members_business_idx
  on public.staff_members (business_id, active);

create trigger staff_members_set_updated_at
  before update on public.staff_members
  for each row execute function app.set_updated_at();

-- =============================================================================
-- services
-- =============================================================================
create table if not exists public.services (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null references public.businesses(id) on delete cascade,
  name                   text not null check (char_length(name) between 1 and 200),
  description            text check (char_length(description) <= 2000),
  duration_minutes       integer not null check (duration_minutes between 5 and 480),
  price                  numeric(12, 2) not null check (price >= 0),
  currency               text not null default 'ILS',
  buffer_before_minutes  integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes   integer not null default 0 check (buffer_after_minutes >= 0),
  capacity               integer not null default 1 check (capacity >= 1),
  requires_payment       boolean not null default false,
  deposit_amount         numeric(12, 2) check (deposit_amount is null or deposit_amount >= 0),
  active                 boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists services_business_idx
  on public.services (business_id, active);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function app.set_updated_at();

-- =============================================================================
-- customers
-- =============================================================================
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 1 and 200),
  phone        text,
  email        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists customers_business_idx
  on public.customers (business_id);
create index if not exists customers_phone_idx
  on public.customers (business_id, phone)
  where phone is not null;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function app.set_updated_at();

-- =============================================================================
-- availability_rules (recurring weekly windows — no materialized slots)
-- =============================================================================
create table if not exists public.availability_rules (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  staff_member_id  uuid references public.staff_members(id) on delete cascade,
  location_id      uuid references public.locations(id) on delete cascade,
  day_of_week      smallint not null check (day_of_week between 1 and 7),
  start_time       time not null,
  end_time         time not null,
  effective_from   date,
  effective_until  date,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint availability_rules_time_order check (start_time < end_time)
);

create index if not exists availability_rules_business_idx
  on public.availability_rules (business_id, day_of_week, active);

create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function app.set_updated_at();

-- =============================================================================
-- availability_exceptions (one-off closures or hour changes)
-- =============================================================================
create table if not exists public.availability_exceptions (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  staff_member_id  uuid references public.staff_members(id) on delete cascade,
  location_id      uuid references public.locations(id) on delete cascade,
  exception_date   date not null,
  closed           boolean not null default false,
  start_time       time,
  end_time         time,
  reason           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint availability_exceptions_time_order
    check (closed or (start_time is not null and end_time is not null and start_time < end_time))
);

create index if not exists availability_exceptions_business_date_idx
  on public.availability_exceptions (business_id, exception_date);

create trigger availability_exceptions_set_updated_at
  before update on public.availability_exceptions
  for each row execute function app.set_updated_at();

-- =============================================================================
-- slot_overrides (manual block/open windows — NOT materialized slot inventory)
-- =============================================================================
create table if not exists public.slot_overrides (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  staff_member_id  uuid references public.staff_members(id) on delete cascade,
  location_id      uuid references public.locations(id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  override_type    public.slot_override_type not null default 'block',
  reason           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint slot_overrides_time_order check (starts_at < ends_at)
);

create index if not exists slot_overrides_business_idx
  on public.slot_overrides (business_id, starts_at);

create trigger slot_overrides_set_updated_at
  before update on public.slot_overrides
  for each row execute function app.set_updated_at();

-- =============================================================================
-- cancellation_policies
-- =============================================================================
create table if not exists public.cancellation_policies (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses(id) on delete cascade,
  name                 text not null check (char_length(name) between 1 and 200),
  min_hours_before     integer not null default 24 check (min_hours_before >= 0),
  fee_amount           numeric(12, 2) check (fee_amount is null or fee_amount >= 0),
  currency             text not null default 'ILS',
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists cancellation_policies_business_idx
  on public.cancellation_policies (business_id, active);

create trigger cancellation_policies_set_updated_at
  before update on public.cancellation_policies
  for each row execute function app.set_updated_at();

-- =============================================================================
-- app_settings (one row per business)
-- =============================================================================
create table if not exists public.app_settings (
  id                                    uuid primary key default gen_random_uuid(),
  business_id                           uuid not null references public.businesses(id) on delete cascade,
  booking_window_days                   integer not null default 30 check (booking_window_days between 1 and 365),
  min_hours_before_booking              integer not null default 2 check (min_hours_before_booking >= 0),
  max_appointments_per_customer_per_day integer not null default 1 check (max_appointments_per_customer_per_day >= 1),
  allow_customer_cancellation           boolean not null default true,
  cancellation_min_hours                integer not null default 4 check (cancellation_min_hours >= 0),
  confirmation_message                  text,
  created_at                            timestamptz not null default now(),
  updated_at                            timestamptz not null default now(),
  constraint app_settings_business_unique unique (business_id)
);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function app.set_updated_at();

-- =============================================================================
-- appointments (double-booking prevention per staff member)
-- =============================================================================
create table if not exists public.appointments (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  customer_id         uuid not null references public.customers(id) on delete restrict,
  service_id          uuid not null references public.services(id) on delete restrict,
  staff_member_id     uuid not null references public.staff_members(id) on delete restrict,
  location_id         uuid references public.locations(id) on delete set null,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  status              public.appointment_status not null default 'pending',
  notes               text,
  cancellation_policy_id uuid references public.cancellation_policies(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint appointments_time_order check (starts_at < ends_at)
);

create index if not exists appointments_business_starts_idx
  on public.appointments (business_id, starts_at);
create index if not exists appointments_staff_starts_idx
  on public.appointments (staff_member_id, starts_at);

alter table public.appointments
  drop constraint if exists appointments_no_staff_overlap;

alter table public.appointments
  add constraint appointments_no_staff_overlap
  exclude using gist (
    staff_member_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function app.set_updated_at();

-- =============================================================================
-- payments (no provider integration — ledger only)
-- =============================================================================
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  appointment_id  uuid references public.appointments(id) on delete set null,
  amount          numeric(12, 2) not null check (amount >= 0),
  currency        text not null default 'ILS',
  status          public.payment_status not null default 'pending',
  provider        text,
  provider_ref    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists payments_business_idx
  on public.payments (business_id, created_at desc);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function app.set_updated_at();

-- =============================================================================
-- notification_logs
-- =============================================================================
create table if not exists public.notification_logs (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  appointment_id  uuid references public.appointments(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  channel         public.notification_channel not null,
  status          public.notification_status not null default 'queued',
  payload         jsonb not null default '{}'::jsonb,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists notification_logs_business_idx
  on public.notification_logs (business_id, created_at desc);

-- =============================================================================
-- subscription_plans (platform-level — no business_id)
-- =============================================================================
create table if not exists public.subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 200),
  slug          text not null,
  price         numeric(12, 2) not null check (price >= 0),
  currency      text not null default 'ILS',
  interval      text not null default 'month' check (interval in ('month', 'year')),
  features      jsonb not null default '{}'::jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint subscription_plans_slug_unique unique (slug)
);

create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function app.set_updated_at();

-- =============================================================================
-- business_subscriptions
-- =============================================================================
create table if not exists public.business_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses(id) on delete cascade,
  plan_id               uuid not null references public.subscription_plans(id) on delete restrict,
  status                public.subscription_status not null default 'trialing',
  current_period_start  timestamptz not null default now(),
  current_period_end    timestamptz not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint business_subscriptions_business_unique unique (business_id)
);

create trigger business_subscriptions_set_updated_at
  before update on public.business_subscriptions
  for each row execute function app.set_updated_at();

-- =============================================================================
-- Grants (revoke anon; authenticated via RLS)
-- =============================================================================
revoke all on public.locations                from anon, authenticated;
revoke all on public.staff_members            from anon, authenticated;
revoke all on public.services                 from anon, authenticated;
revoke all on public.customers                from anon, authenticated;
revoke all on public.availability_rules       from anon, authenticated;
revoke all on public.availability_exceptions  from anon, authenticated;
revoke all on public.slot_overrides           from anon, authenticated;
revoke all on public.cancellation_policies    from anon, authenticated;
revoke all on public.app_settings             from anon, authenticated;
revoke all on public.appointments             from anon, authenticated;
revoke all on public.payments                 from anon, authenticated;
revoke all on public.notification_logs        from anon, authenticated;
revoke all on public.subscription_plans       from anon, authenticated;
revoke all on public.business_subscriptions   from anon, authenticated;

grant select, insert, update, delete on public.locations                to authenticated;
grant select, insert, update, delete on public.staff_members            to authenticated;
grant select, insert, update, delete on public.services                 to authenticated;
grant select, insert, update, delete on public.customers                to authenticated;
grant select, insert, update, delete on public.availability_rules       to authenticated;
grant select, insert, update, delete on public.availability_exceptions  to authenticated;
grant select, insert, update, delete on public.slot_overrides           to authenticated;
grant select, insert, update, delete on public.cancellation_policies    to authenticated;
grant select, insert, update, delete on public.app_settings             to authenticated;
grant select, insert, update, delete on public.appointments               to authenticated;
grant select, insert, update, delete on public.payments                 to authenticated;
grant select, insert, update, delete on public.notification_logs        to authenticated;
grant select                         on public.subscription_plans       to authenticated;
grant select, insert, update, delete on public.business_subscriptions   to authenticated;

-- =============================================================================
-- RLS enable
-- =============================================================================
alter table public.locations                enable row level security;
alter table public.staff_members            enable row level security;
alter table public.services                 enable row level security;
alter table public.customers                enable row level security;
alter table public.availability_rules       enable row level security;
alter table public.availability_exceptions  enable row level security;
alter table public.slot_overrides           enable row level security;
alter table public.cancellation_policies    enable row level security;
alter table public.app_settings             enable row level security;
alter table public.appointments             enable row level security;
alter table public.payments                 enable row level security;
alter table public.notification_logs        enable row level security;
alter table public.subscription_plans       enable row level security;
alter table public.business_subscriptions   enable row level security;

-- ----- Policy helper macros via repeated patterns ----------------------------
-- Member read: app.is_member_of(business_id)
-- Member write (owner/admin): app.is_member_of(business_id, array['business_owner','business_admin']::member_role[])
-- Platform admin: app.is_platform_admin()

-- locations
create policy locations_select_members on public.locations for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy locations_mutate_admins on public.locations for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- staff_members
create policy staff_select_members on public.staff_members for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy staff_mutate_admins on public.staff_members for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- services
create policy services_select_members on public.services for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy services_mutate_admins on public.services for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- customers
create policy customers_select_members on public.customers for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy customers_mutate_staff on public.customers for all to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin())
  with check (app.is_member_of(business_id) or app.is_platform_admin());

-- availability_rules
create policy availability_rules_select_members on public.availability_rules for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy availability_rules_mutate_admins on public.availability_rules for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- availability_exceptions
create policy availability_exceptions_select_members on public.availability_exceptions for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy availability_exceptions_mutate_admins on public.availability_exceptions for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- slot_overrides
create policy slot_overrides_select_members on public.slot_overrides for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy slot_overrides_mutate_admins on public.slot_overrides for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- cancellation_policies
create policy cancellation_policies_select_members on public.cancellation_policies for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy cancellation_policies_mutate_admins on public.cancellation_policies for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- app_settings
create policy app_settings_select_members on public.app_settings for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy app_settings_mutate_owners on public.app_settings for all to authenticated
  using (app.is_member_of(business_id, array['business_owner']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner']::public.member_role[]) or app.is_platform_admin());

-- appointments
create policy appointments_select_members on public.appointments for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy appointments_mutate_staff on public.appointments for all to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin())
  with check (app.is_member_of(business_id) or app.is_platform_admin());

-- payments
create policy payments_select_admins on public.payments for select to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());
create policy payments_mutate_admins on public.payments for all to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin())
  with check (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());

-- notification_logs
create policy notification_logs_select_admins on public.notification_logs for select to authenticated
  using (app.is_member_of(business_id, array['business_owner','business_admin']::public.member_role[]) or app.is_platform_admin());
-- inserts via service role / server only (no client insert policy)

-- subscription_plans (platform catalog)
create policy subscription_plans_select_all on public.subscription_plans for select to authenticated
  using (active or app.is_platform_admin());
create policy subscription_plans_mutate_platform on public.subscription_plans for all to authenticated
  using (app.is_platform_admin())
  with check (app.is_platform_admin());

-- business_subscriptions
create policy business_subscriptions_select on public.business_subscriptions for select to authenticated
  using (app.is_member_of(business_id) or app.is_platform_admin());
create policy business_subscriptions_mutate on public.business_subscriptions for all to authenticated
  using (app.is_platform_admin())
  with check (app.is_platform_admin());

comment on table public.slot_overrides is
  'Manual block/open windows. Slots are computed from rules + overrides — never materialized.';
comment on table public.availability_rules is
  'Recurring weekly availability windows. Slot engine derives slots at query time.';
comment on constraint appointments_no_staff_overlap on public.appointments is
  'Prevents overlapping pending/confirmed appointments for the same staff member.';
