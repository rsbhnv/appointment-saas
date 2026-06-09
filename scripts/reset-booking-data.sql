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
-- HOW TO RUN (Supabase SQL Editor):
--   1. Set v_target_slug below (or NULL for ALL businesses — dangerous).
--   2. Run section A (PREVIEW) and verify counts.
--   3. Run section B (DELETE) — irreversible.
--
-- Does NOT touch challenge_days (separate remote-only table).
-- =============================================================================

-- ── A. PREVIEW (safe) ────────────────────────────────────────────────────────
-- Edit slug here only:
--   'odelia-clinic'  = one business
--   NULL             = all businesses

do $$
declare
  v_target_slug text := 'odelia-clinic';
  v_business_ids uuid[];
begin
  select coalesce(array_agg(id), '{}')
  into v_business_ids
  from public.businesses b
  where v_target_slug is null or b.slug = v_target_slug;

  if array_length(v_business_ids, 1) is null then
    raise exception 'No businesses matched slug %', v_target_slug;
  end if;

  raise notice 'Target business count: %', array_length(v_business_ids, 1);
  raise notice 'appointments:              %',
    (select count(*) from public.appointments where business_id = any(v_business_ids));
  raise notice 'customers:                 %',
    (select count(*) from public.customers where business_id = any(v_business_ids));
  raise notice 'availability_rules:        %',
    (select count(*) from public.availability_rules where business_id = any(v_business_ids));
  raise notice 'availability_exceptions:   %',
    (select count(*) from public.availability_exceptions where business_id = any(v_business_ids));
  raise notice 'slot_overrides:            %',
    (select count(*) from public.slot_overrides where business_id = any(v_business_ids));
  raise notice 'payments:                  %',
    (select count(*) from public.payments where business_id = any(v_business_ids));
  raise notice 'notification_logs:         %',
    (select count(*) from public.notification_logs where business_id = any(v_business_ids));
  raise notice 'audit_logs (booking):      %',
    (select count(*) from public.audit_logs
     where business_id = any(v_business_ids)
       and entity_type in (
         'appointment', 'availability_rule', 'availability_exception',
         'slot_override', 'customer'
       ));
end $$;


-- ── B. DELETE (irreversible — run only after preview) ────────────────────────
-- Edit slug to match section A, then run this block alone.

do $$
declare
  v_target_slug text := 'odelia-clinic';
  v_business_ids uuid[];
begin
  select coalesce(array_agg(id), '{}')
  into v_business_ids
  from public.businesses b
  where v_target_slug is null or b.slug = v_target_slug;

  if array_length(v_business_ids, 1) is null then
    raise exception 'No businesses matched slug %', v_target_slug;
  end if;

  delete from public.notification_logs
  where business_id = any(v_business_ids);

  delete from public.payments
  where business_id = any(v_business_ids);

  delete from public.appointments
  where business_id = any(v_business_ids);

  delete from public.slot_overrides
  where business_id = any(v_business_ids);

  delete from public.availability_exceptions
  where business_id = any(v_business_ids);

  delete from public.availability_rules
  where business_id = any(v_business_ids);

  delete from public.customers
  where business_id = any(v_business_ids);

  delete from public.audit_logs
  where business_id = any(v_business_ids)
    and entity_type in (
      'appointment',
      'availability_rule',
      'availability_exception',
      'slot_override',
      'customer'
    );

  raise notice 'Delete complete for % business(es).', array_length(v_business_ids, 1);
end $$;


-- ── C. OPTIONAL: cross-scope duplicate availability (read-only) ──────────────
/*
select g.business_id, g.day_of_week, g.start_time, g.end_time, s.staff_member_id
from public.availability_rules g
join public.availability_rules s
  on s.business_id = g.business_id
 and s.day_of_week = g.day_of_week
 and s.start_time = g.start_time
 and s.end_time = g.end_time
 and s.staff_member_id is not null
where g.staff_member_id is null
  and g.business_id in (
    select id from public.businesses where slug = 'odelia-clinic'
  );
*/
