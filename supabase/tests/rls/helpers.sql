-- Shared helpers for pgTAP tests.
-- Source via:  \i supabase/tests/rls/helpers.sql

-- Insert a fixture user into auth.users (service role only).
create or replace function tests.create_test_user(p_email text)
returns uuid
language plpgsql
as $$
declare
  uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at)
  values (uid, p_email, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now());
  return uid;
end;
$$;

-- Set the current session to a given user as the 'authenticated' role.
create or replace function tests.act_as(p_user uuid, p_platform_role text default null)
returns void
language plpgsql
as $$
declare
  claims jsonb;
begin
  claims := jsonb_build_object('sub', p_user, 'role', 'authenticated');
  if p_platform_role is not null then
    claims := claims || jsonb_build_object('app_metadata', jsonb_build_object('platform_role', p_platform_role));
  end if;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', claims::text, true);
end;
$$;

create or replace function tests.act_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{}', true);
end;
$$;
