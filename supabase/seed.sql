-- =============================================================================
-- Seed: one demo business aligned with src/lib/demo/fixtures.ts UUIDs.
-- Run after migrations. Membership rows require real auth.users — create users
-- in Supabase Auth dashboard, then link via business_members separately.
-- =============================================================================

insert into public.businesses (
  id, name, slug, description, timezone, locale, currency, status
) values (
  '00000000-0000-0000-0000-00000000b001',
  'Demo Studio',
  'demo-studio',
  'Sample business for local development and UI previews.',
  'Asia/Jerusalem',
  'he',
  'ILS',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.locations (
  id, business_id, name, city, is_primary, active
) values (
  '00000000-0000-0000-0000-00000000l001',
  '00000000-0000-0000-0000-00000000b001',
  'Main location',
  'Tel Aviv',
  true,
  true
)
on conflict (id) do nothing;

insert into public.services (
  id, business_id, name, description, duration_minutes, price, currency,
  buffer_before_minutes, buffer_after_minutes, capacity, requires_payment,
  deposit_amount, active
) values
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000b001',
    'Initial consultation',
    'Introductory session.',
    45, 250.00, 'ILS', 0, 10, 1, false, null, true
  ),
  (
    '00000000-0000-0000-0000-00000000c002',
    '00000000-0000-0000-0000-00000000b001',
    'Follow-up session',
    'Continuation session.',
    30, 180.00, 'ILS', 0, 5, 1, false, null, true
  ),
  (
    '00000000-0000-0000-0000-00000000c003',
    '00000000-0000-0000-0000-00000000b001',
    'Group workshop',
    'Group session up to 6 participants.',
    90, 120.00, 'ILS', 15, 15, 6, true, 50.00, false
  )
on conflict (id) do nothing;

insert into public.staff_members (
  id, business_id, name, title, color, active
) values
  (
    '00000000-0000-0000-0000-00000000e001',
    '00000000-0000-0000-0000-00000000b001',
    'Business Owner',
    'Owner',
    '#7c3aed',
    true
  ),
  (
    '00000000-0000-0000-0000-00000000e002',
    '00000000-0000-0000-0000-00000000b001',
    'Staff Member',
    'Staff',
    '#06b6d4',
    true
  )
on conflict (id) do nothing;

insert into public.app_settings (
  id, business_id, booking_window_days, min_hours_before_booking,
  max_appointments_per_customer_per_day, allow_customer_cancellation,
  cancellation_min_hours, confirmation_message
) values (
  '00000000-0000-0000-0000-00000000f001',
  '00000000-0000-0000-0000-00000000b001',
  30, 2, 1, true, 4,
  'Thank you for booking. You may cancel up to 4 hours before the appointment.'
)
on conflict (business_id) do update set
  booking_window_days = excluded.booking_window_days,
  updated_at = now();

insert into public.cancellation_policies (
  id, business_id, name, min_hours_before, fee_amount, currency, active
) values (
  '00000000-0000-0000-0000-00000000p001',
  '00000000-0000-0000-0000-00000000b001',
  'Standard cancellation',
  4, null, 'ILS', true
)
on conflict (id) do nothing;

insert into public.availability_rules (
  id, business_id, staff_member_id, day_of_week, start_time, end_time, active
) values
  (
    '00000000-0000-0000-0000-00000000r001',
    '00000000-0000-0000-0000-00000000b001',
    '00000000-0000-0000-0000-00000000e001',
    1, '09:00', '17:00', true
  ),
  (
    '00000000-0000-0000-0000-00000000r002',
    '00000000-0000-0000-0000-00000000b001',
    '00000000-0000-0000-0000-00000000e001',
    2, '09:00', '17:00', true
  )
on conflict (id) do nothing;

insert into public.subscription_plans (
  id, name, slug, price, currency, interval, features, active
) values (
  '00000000-0000-0000-0000-00000000s001',
  'Starter',
  'starter',
  99.00,
  'ILS',
  'month',
  '{"max_staff": 3, "max_locations": 1}'::jsonb,
  true
)
on conflict (slug) do nothing;

insert into public.business_subscriptions (
  id, business_id, plan_id, status, current_period_start, current_period_end
)
select
  '00000000-0000-0000-0000-00000000b002',
  '00000000-0000-0000-0000-00000000b001',
  sp.id,
  'active',
  now(),
  now() + interval '30 days'
from public.subscription_plans sp
where sp.slug = 'starter'
on conflict (business_id) do nothing;

insert into public.audit_logs (
  id, business_id, user_id, action, entity_type, entity_id, metadata
) values (
  '00000000-0000-0000-0000-00000000a001',
  '00000000-0000-0000-0000-00000000b001',
  null,
  'business.seeded',
  'businesses',
  '00000000-0000-0000-0000-00000000b001',
  '{"source": "seed.sql"}'::jsonb
)
on conflict (id) do nothing;
