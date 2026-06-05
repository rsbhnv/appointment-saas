-- Track 24-hour SMS reminders to prevent duplicate sends.
alter table public.appointments
  add column if not exists reminder_sent_at timestamptz null;

comment on column public.appointments.reminder_sent_at is
  'When the 24-hour SMS reminder was sent (null = not sent yet).';

create index if not exists idx_appointments_reminder_pending
  on public.appointments (starts_at)
  where reminder_sent_at is null
    and status in ('pending', 'confirmed');
