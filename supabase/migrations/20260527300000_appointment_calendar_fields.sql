-- Calendar management fields for appointments and customer consent

alter table public.appointments
  add column if not exists internal_notes text,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

alter table public.customers
  add column if not exists sms_consent boolean not null default false,
  add column if not exists whatsapp_consent boolean not null default false,
  add column if not exists email_consent boolean not null default false;

comment on column public.appointments.internal_notes is
  'Staff-only notes; not shown to customers.';
comment on column public.appointments.cancellation_reason is
  'Reason recorded when status is cancelled.';
comment on column public.appointments.cancelled_at is
  'Timestamp when appointment was cancelled.';
