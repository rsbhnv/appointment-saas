-- =============================================================================
-- Fix: app.set_updated_at must pin search_path (Supabase security advisor).
-- Trigger behavior unchanged — sets NEW.updated_at on row update.
-- =============================================================================

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function app.set_updated_at() is
  'Before-update trigger: sets updated_at = now(). search_path pinned for security.';
