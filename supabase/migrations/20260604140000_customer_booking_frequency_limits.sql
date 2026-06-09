-- Per-customer booking frequency limits (business-configurable).
alter table public.app_settings
  add column if not exists limit_one_booking_per_day boolean not null default true,
  add column if not exists limit_one_booking_per_week boolean not null default false,
  add column if not exists limit_one_booking_per_month boolean not null default false;

comment on column public.app_settings.limit_one_booking_per_day is
  'When true, a customer may have at most one active booking on the same calendar day.';
comment on column public.app_settings.limit_one_booking_per_week is
  'When true, a customer may have at most one active booking in the same Sunday-start week.';
comment on column public.app_settings.limit_one_booking_per_month is
  'When true, a customer may have at most one active booking in the same calendar month.';
