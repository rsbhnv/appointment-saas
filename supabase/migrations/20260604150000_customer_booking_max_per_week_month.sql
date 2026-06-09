-- Per-customer booking frequency limits (enable flags + numeric caps).
-- Self-contained: safe if 20260604140000 was not applied yet.

alter table public.app_settings
  add column if not exists limit_one_booking_per_day boolean not null default true,
  add column if not exists limit_one_booking_per_week boolean not null default false,
  add column if not exists limit_one_booking_per_month boolean not null default false,
  add column if not exists max_appointments_per_customer_per_week integer not null default 1
    check (max_appointments_per_customer_per_week >= 1),
  add column if not exists max_appointments_per_customer_per_month integer not null default 1
    check (max_appointments_per_customer_per_month >= 1);

comment on column public.app_settings.limit_one_booking_per_day is
  'When true, enforce max_appointments_per_customer_per_day for the same calendar day.';
comment on column public.app_settings.limit_one_booking_per_week is
  'When true, enforce max_appointments_per_customer_per_week for the same Sunday-start week.';
comment on column public.app_settings.limit_one_booking_per_month is
  'When true, enforce max_appointments_per_customer_per_month for the same calendar month.';
