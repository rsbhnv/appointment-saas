-- =============================================================================
-- Reset booking & availability data (keeps businesses, staff, services, users)
-- =============================================================================
--
-- WHAT THIS DOES (irreversible):
--   Deletes appointments, customers, availability rules/exceptions, slot blocks,
--   payments, and notification logs for the selected business(es).
--
-- WHAT THIS KEEPS:
--   businesses, business_members, staff_members, services, app_settings,
--   locations, cancellation_policies, subscriptions, auth users.
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor (or psql as postgres).
--   2. Edit target_businesses below (one slug, or remove WHERE for ALL tenants).
--   3. Run the PREVIEW section first and verify row counts.
--   4. Uncomment BEGIN/COMMIT and run the DELETE section.
--
-- Does NOT touch challenge_days (separate remote-only table).
-- =============================================================================

-- ── 1. TARGET ────────────────────────────────────────────────────────────────
-- Option A: single business by slug
-- Option B: comment out the WHERE line to affect ALL businesses (dangerous)

with target_businesses as (
  select id, slug, name
  from public.businesses
  where slug = 'odelia-clinic'  -- ← change slug, or remove this line for ALL
)

-- ── 2. PREVIEW (safe — run this first) ─────────────────────────────────────
select 'businesses (target)' as table_name, count(*) as rows
from target_businesses
union all
select 'appointments', count(*)
from public.appointments a
where a.business_id in (select id from target_businesses)
union all
select 'customers', count(*)
from public.customers c
where c.business_id in (select id from target_businesses)
union all
select 'availability_rules', count(*)
from public.availability_rules r
where r.business_id in (select id from target_businesses)
union all
select 'availability_exceptions', count(*)
from public.availability_exceptions e
where e.business_id in (select id from target_businesses)
union all
select 'slot_overrides', count(*)
from public.slot_overrides s
where s.business_id in (select id from target_businesses)
union all
select 'payments', count(*)
from public.payments p
where p.business_id in (select id from target_businesses)
union all
select 'notification_logs', count(*)
from public.notification_logs n
where n.business_id in (select id from target_businesses)
union all
select 'audit_logs (booking-related)', count(*)
from public.audit_logs al
where al.business_id in (select id from target_businesses)
  and al.entity_type in (
    'appointment',
    'availability_rule',
    'availability_exception',
    'slot_override',
    'customer'
  )
order by 1;


-- ── 3. DELETE (irreversible — uncomment transaction block to run) ────────────
/*
begin;

with target_businesses as (
  select id
  from public.businesses
  where slug = 'odelia-clinic'  -- ← must match preview filter
)

-- Child tables first (FK-safe order)
delete from public.notification_logs n
where n.business_id in (select id from target_businesses);

delete from public.payments p
where p.business_id in (select id from target_businesses);

delete from public.appointments a
where a.business_id in (select id from target_businesses);

delete from public.slot_overrides s
where s.business_id in (select id from target_businesses);

delete from public.availability_exceptions e
where e.business_id in (select id from target_businesses);

delete from public.availability_rules r
where r.business_id in (select id from target_businesses);

delete from public.customers c
where c.business_id in (select id from target_businesses);

delete from public.audit_logs al
where al.business_id in (select id from target_businesses)
  and al.entity_type in (
    'appointment',
    'availability_rule',
    'availability_exception',
    'slot_override',
    'customer'
  );

commit;
*/


-- ── 4. OPTIONAL: find cross-scope duplicate availability (read-only) ─────────
/*
with target_businesses as (
  select id from public.businesses where slug = 'odelia-clinic'
),
global_rules as (
  select business_id, day_of_week, start_time, end_time
  from public.availability_rules
  where business_id in (select id from target_businesses)
    and staff_member_id is null
),
staff_rules as (
  select business_id, staff_member_id, day_of_week, start_time, end_time
  from public.availability_rules
  where business_id in (select id from target_businesses)
    and staff_member_id is not null
)
select g.*, s.staff_member_id
from global_rules g
join staff_rules s using (business_id, day_of_week, start_time, end_time);
*/
