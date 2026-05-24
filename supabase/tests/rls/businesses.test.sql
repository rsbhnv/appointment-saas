begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- ----- Slug validation (independent of RLS) ---------------------------------
select throws_ok(
  $$insert into public.businesses (name, slug) values ('A', 'admin')$$,
  '22023',
  'invalid_input: slug is reserved',
  'reserved slug rejected'
);

select throws_ok(
  $$insert into public.businesses (name, slug) values ('B', '--bad')$$,
  '22023',
  null,
  'malformed slug rejected'
);

select throws_ok(
  $$insert into public.businesses (name, slug) values ('C', 'a')$$,
  '22023',
  'invalid_input: slug must be 2-64 characters',
  'too-short slug rejected'
);

-- ----- Fixtures -------------------------------------------------------------
set local role postgres;

create extension if not exists "pgcrypto";

create schema if not exists tests;
\i supabase/tests/rls/helpers.sql

do $$
declare
  alice  uuid := tests.create_test_user('alice@example.com');
  bob    uuid := tests.create_test_user('bob@example.com');
  carol  uuid := tests.create_test_user('carol@example.com');  -- platform admin
  biz_a  uuid;
  biz_b  uuid;
begin
  insert into public.businesses (name, slug) values ('Biz A', 'biz-a') returning id into biz_a;
  insert into public.businesses (name, slug) values ('Biz B', 'biz-b') returning id into biz_b;
  insert into public.business_members (business_id, user_id, role) values (biz_a, alice, 'business_owner');
  insert into public.business_members (business_id, user_id, role) values (biz_b, bob,   'business_owner');
  perform set_config('tests.alice', alice::text, false);
  perform set_config('tests.bob',   bob::text,   false);
  perform set_config('tests.carol', carol::text, false);
  perform set_config('tests.biz_a', biz_a::text, false);
  perform set_config('tests.biz_b', biz_b::text, false);
end
$$;

-- ----- Cross-tenant isolation ----------------------------------------------
select tests.act_as(current_setting('tests.alice')::uuid);

select is(
  (select count(*) from public.businesses where id = current_setting('tests.biz_a')::uuid),
  1::bigint,
  'alice sees her own business'
);

select is(
  (select count(*) from public.businesses where id = current_setting('tests.biz_b')::uuid),
  0::bigint,
  'alice cannot see another business'
);

-- ----- Update authority -----------------------------------------------------
select lives_ok(
  $$update public.businesses set description = 'updated' where slug = 'biz-a'$$,
  'owner can update own business'
);

select is(
  (update public.businesses set description = 'leak' where slug = 'biz-b' returning 1),
  null,
  'owner cannot update another business (no rows returned)'
);

-- ----- Platform admin override ---------------------------------------------
select tests.act_as(current_setting('tests.carol')::uuid, 'super_admin');

select is(
  (select count(*) from public.businesses),
  2::bigint,
  'platform admin reads all businesses'
);

-- ----- Anon -----------------------------------------------------------------
select tests.act_as_anon();

select is(
  (select count(*) from public.business_public),
  0::bigint,
  'business_public hides non-active businesses from anon'
);

select * from finish();
rollback;
