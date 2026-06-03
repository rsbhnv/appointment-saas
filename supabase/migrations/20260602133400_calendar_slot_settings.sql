alter table public.app_settings
  add column if not exists default_slot_duration_minutes integer not null default 60
    check (default_slot_duration_minutes between 5 and 480),
  add column if not exists break_between_appointments_minutes integer not null default 15
    check (break_between_appointments_minutes between 0 and 240);
