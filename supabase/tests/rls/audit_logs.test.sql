begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

set local role postgres;

create extension if not exists "pgcrypto";
create schema if not exists tests;
\i supabase/tests/rls/helpers.sql

do $$
declare
  alice  uuid := tests.create_test_user('alice@example.com');
  bob    uuid := tests.create_test_user('bob@example.com');
  carol  uuid := tests.create_test_user('carol@example.com');
  biz_a  uuid;
  biz_b  uuid;
begin
  insert into public.businesses (name, slug) values ('Biz A', 'biz-a') returning id into biz_a;
  insert into public.businesses (name, slug) values ('Biz B', 'biz-b') returning id into biz_b;
  insert into public.business_members (business_id, user_id, role) values (biz_a, alice, 'business_owner');
  insert into public.business_members (business_id, user_id, role) values (biz_b, bob,   'business_owner');
  insert into public.audit_logs (business_id, user_id, action) values (biz_a, alice, 'member.added');
  insert into public.audit_logs (business_id, user_id, action) values (biz_b, bob,   'member.added');
  perform set_config('tests.alice', alice::text, false);
  perform set_config('tests.bob',   bob::text,   false);
  perform set_config('tests.carol', carol::text, false);
  perform set_config('tests.biz_a', biz_a::text, false);
  perform set_config('tests.biz_b', biz_b::text, false);
end
$$;

-- ----- Business admins/owners can read their business's logs ---------------
select tests.act_as(current_setting('tests.alice')::uuid);

select is(
  (select count(*) from public.audit_logs
     where business_id = current_setting('tests.biz_a')::uuid),
  1::bigint,
  'owner reads own business audit logs'
);

select is(
  (select count(*) from public.audit_logs
     where business_id = current_setting('tests.biz_b')::uuid),
  0::bigint,
  'owner cannot read other business audit logs'
);

-- ----- Direct client writes are blocked (no insert policy) -----------------
select throws_ok(
  $$insert into public.audit_logs (business_id, action) values (current_setting('tests.biz_a')::uuid, 'tampered')$$,
  '42501',
  null,
  'authenticated cannot insert audit_logs from client (service role only)'
);

-- ----- Platform admin sees everything --------------------------------------
select tests.act_as(current_setting('tests.carol')::uuid, 'super_admin');

select is(
  (select count(*) from public.audit_logs),
  2::bigint,
  'platform admin reads all audit logs'
);

select * from finish();
rollback;
