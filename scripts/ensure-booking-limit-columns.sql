-- Run once in Supabase SQL Editor if booking settings save fails.
-- Safe to re-run (IF NOT EXISTS).

alter table public.app_settings
  add column if not exists limit_one_booking_per_day boolean not null default true,
  add column if not exists limit_one_booking_per_week boolean not null default false,
  add column if not exists limit_one_booking_per_month boolean not null default false,
  add column if not exists max_appointments_per_customer_per_week integer not null default 1
    check (max_appointments_per_customer_per_week >= 1),
  add column if not exists max_appointments_per_customer_per_month integer not null default 1
    check (max_appointments_per_customer_per_month >= 1);

-- Refresh PostgREST schema cache (Supabase API).
notify pgrst, 'reload schema';
