begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

set local role postgres;

create extension if not exists "pgcrypto";
create schema if not exists tests;
\i supabase/tests/rls/helpers.sql

do $$
declare
  alice    uuid := tests.create_test_user('alice@example.com');
  bob      uuid := tests.create_test_user('bob@example.com');
  mallory  uuid := tests.create_test_user('mallory@example.com');
  biz_a    uuid;
  biz_b    uuid;
begin
  insert into public.businesses (name, slug) values ('Biz A', 'biz-a') returning id into biz_a;
  insert into public.businesses (name, slug) values ('Biz B', 'biz-b') returning id into biz_b;
  insert into public.business_members (business_id, user_id, role) values (biz_a, alice, 'business_owner');
  insert into public.business_members (business_id, user_id, role) values (biz_a, bob,   'staff');
  insert into public.business_members (business_id, user_id, role) values (biz_b, mallory, 'business_owner');
  perform set_config('tests.alice',   alice::text,   false);
  perform set_config('tests.bob',     bob::text,     false);
  perform set_config('tests.mallory', mallory::text, false);
  perform set_config('tests.biz_a',   biz_a::text,   false);
  perform set_config('tests.biz_b',   biz_b::text,   false);
end
$$;

-- ----- Owner sees every member of own business ------------------------------
select tests.act_as(current_setting('tests.alice')::uuid);

select is(
  (select count(*) from public.business_members
     where business_id = current_setting('tests.biz_a')::uuid),
  2::bigint,
  'owner of biz_a sees both members'
);

-- ----- Staff sees only own row, never peers ---------------------------------
select tests.act_as(current_setting('tests.bob')::uuid);

select is(
  (select count(*) from public.business_members
     where business_id = current_setting('tests.biz_a')::uuid),
  1::bigint,
  'staff in biz_a sees only own membership row'
);

select is(
  (select count(*) from public.business_members
     where business_id = current_setting('tests.biz_b')::uuid),
  0::bigint,
  'staff in biz_a cannot read members of biz_b'
);

-- ----- Staff cannot invite (insert) ----------------------------------------
select throws_ok(
  $$insert into public.business_members (business_id, user_id, role)
    values (current_setting('tests.biz_a')::uuid, current_setting('tests.mallory')::uuid, 'staff')$$,
  '42501',
  null,
  'staff cannot insert into business_members (RLS denies)'
);

-- ----- Owner can insert -----------------------------------------------------
select tests.act_as(current_setting('tests.alice')::uuid);

select lives_ok(
  $$insert into public.business_members (business_id, user_id, role)
    values (current_setting('tests.biz_a')::uuid, current_setting('tests.mallory')::uuid, 'staff')$$,
  'owner can insert into business_members'
);

-- ----- Cross-business owner cannot insert ----------------------------------
select tests.act_as(current_setting('tests.mallory')::uuid);

select throws_ok(
  $$insert into public.business_members (business_id, user_id, role)
    values (current_setting('tests.biz_a')::uuid, current_setting('tests.mallory')::uuid, 'business_admin')$$,
  '42501',
  null,
  'owner of biz_b cannot insert into biz_a'
);

select * from finish();
rollback;
