# Supabase RLS strategy

This document is the source of truth for how Row Level Security is applied across the multi-tenant SaaS. Every new table is opened for review against this checklist before merge.

## 1. Principles

1. **Default deny.** RLS is enabled on every table in `public.*`. No table is "internal".
2. **Tenant isolation by `business_id`.** Tenant-scoped tables filter on `business_id` via membership.
3. **RLS is the last line, not the only line.** App code (`server/guards/`, Zod, Server Actions) also enforces — RLS catches what the app forgets.
4. **No anon writes to mutable tenant tables.** Public booking writes go through a `SECURITY DEFINER` function with explicit checks (Phase 4).
5. **Service-role calls are audited.** Bypassing RLS requires logging via `audit_logs`.

## 2. Helper functions

Created in a private `app` schema (not exposed to `anon`):

- `app.is_member_of(target_business uuid, required_roles public.member_role[] default null) returns boolean`
  - Returns `true` when `auth.uid()` has an active membership in `target_business`, optionally restricted to a set of roles.
- `app.is_platform_admin() returns boolean`
  - Reads `app_metadata.platform_role` from the request JWT claims. The claim is only ever set by trusted server code.
- `app.is_reserved_slug(candidate text) returns boolean`
  - Returns `true` if `candidate` matches the reserved-word array (mirrored from [`src/lib/tenant/reserved-slugs.ts`](../src/lib/tenant/reserved-slugs.ts)). Used by the `businesses` insert/update trigger.

All helpers are declared `stable security definer language sql` with `set search_path = pg_catalog` and `revoke execute ... from public` followed by `grant execute ... to authenticated, anon` only when the caller role legitimately needs the helper.

### SECURITY DEFINER hardening rules

Every `SECURITY DEFINER` function in this project must satisfy all of:

1. **Explicit search_path** — always `set search_path = pg_catalog` (extend to `public` only when the function intentionally touches `public.*` and references those names fully qualified).
2. **Strict input validation at function top** — UUIDs, slugs, enums, length, and shape are checked before any reads or writes. Invalid input raises `exception 'invalid_input: …'`.
3. **Membership / authority check** — `auth.uid()` is verified against `business_members` (or a documented anon-flow constraint) before any tenant-scoped read or write.
4. **Restricted execute grants** — `revoke execute from public` then `grant execute to <named role>` (typically `authenticated`, sometimes `anon` for the anon booking flow).
5. **pgTAP coverage** — at least one negative test (rejects unauthorized caller, rejects malformed input) and one positive test per function.

Phase 1 ships no `SECURITY DEFINER` functions of its own. These rules pre-empt Phase 4's `public.book_appointment(...)`.

## 3. Policy patterns

Each pattern is parameterized by table and role set. The same template is reused for every new tenant-scoped table.

### 3.1 Tenant-scoped table (`tenant_table`)

```sql
alter table public.tenant_table enable row level security;

create policy "tenant_table_select"
  on public.tenant_table for select
  using (
    app.is_member_of(business_id)
    or app.is_platform_admin()
  );

create policy "tenant_table_insert"
  on public.tenant_table for insert
  with check (
    app.is_member_of(business_id, ARRAY['business_owner','business_admin']::public.member_role[])
    or app.is_platform_admin()
  );

create policy "tenant_table_update"
  on public.tenant_table for update
  using (
    app.is_member_of(business_id, ARRAY['business_owner','business_admin']::public.member_role[])
    or app.is_platform_admin()
  )
  with check (
    app.is_member_of(business_id, ARRAY['business_owner','business_admin']::public.member_role[])
    or app.is_platform_admin()
  );

create policy "tenant_table_delete"
  on public.tenant_table for delete
  using (
    app.is_member_of(business_id, ARRAY['business_owner']::public.member_role[])
    or app.is_platform_admin()
  );
```

Notes:

- `staff` reads are allowed via the default `select` policy. Staff-only mutation policies are added per table where needed (e.g., a staff member can update their own appointments' notes).
- `with check` is always paired with `using` on update to prevent moving rows to a foreign tenant.
- Delete is owner-only by default; admins can delete only when explicitly stated for that table.

### 3.2 `businesses`

The `businesses` row is the tenant root. Members can read and update it; only platform admins can insert or delete.

- `select`: `app.is_member_of(id) or app.is_platform_admin()`
- `update`: `app.is_member_of(id, ARRAY['business_owner']) or app.is_platform_admin()`
- `insert`/`delete`: `app.is_platform_admin()`

Slug is globally unique (`UNIQUE` constraint) and validated by a `before insert/update` trigger that:

- Lowercases the slug.
- Enforces the format regex `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`, length 2–64, no double hyphens.
- Rejects any slug for which `app.is_reserved_slug(slug)` returns true.

This guarantees no business can register `admin`, `api`, `login`, etc., regardless of which entry point creates the row.

For the public booking flow we expose a **view**, not the table:

```sql
create or replace view public.business_public as
  select id, slug, name, description, logo_url, primary_color,
         timezone, locale, currency
  from public.businesses
  where status = 'active';

grant select on public.business_public to anon, authenticated;
```

The base table remains revoked from `anon`. The view inherits invoker privileges but exposes only the columns needed for the customer landing page.

### 3.3 `business_members`

- `select`: a user can see their own membership row, and admins can see all rows in their business.
  - `user_id = auth.uid() or app.is_member_of(business_id, ARRAY['business_owner','business_admin'])`
- `insert` / `update` / `delete`: owner-only (`business_owner`) or `app.is_platform_admin()`.

`business_admin` cannot promote a user to `business_owner` — this is enforced by an application-layer check in the invite/role-change Server Action, plus a `BEFORE UPDATE` trigger that blocks role escalation (added in Phase 2 once invites land).

### 3.4 `audit_logs`

- `select`: business admins/owners of `business_id` plus platform admins.
- `insert`/`update`/`delete`: **no policies** — the table is writable only via the service role. App code never grants users direct INSERT.

## 4. Anonymous access

Anonymous (`anon` role) access is **read-only** and **limited to dedicated views**:

- `public.business_public` for the booking landing page (slug → public branding fields).
- Read-only service catalog and availability views will be added in Phases 2–3 with the same view-only pattern.

Booking writes (Phase 4) flow through `public.book_appointment(...)` — a `SECURITY DEFINER` function with rate limiting and slot re-validation. Anon never writes to `appointments`, `customers`, or `payments` directly.

## 5. Service-role usage

The service-role key bypasses RLS. It lives in [src/lib/supabase/admin.ts](../src/lib/supabase/admin.ts) (server-only) and is used only for:

- System provisioning (creating a business + first owner).
- Webhooks (payments, notifications) — Phase 7+.
- Background jobs / cron via Supabase Edge Functions.
- Writing to `audit_logs`.

Every service-role mutation is wrapped by `withAudit()` so the action is recorded with the actor (`user_id`) and metadata.

## 6. JWT claims contract

- `auth.uid()` — Supabase user id; trusted.
- `app_metadata.platform_role` — `'super_admin'` for platform admins. Set only by service-role writes to `auth.users`. Never settable from the client.
- `user_metadata.*` — treated as untrusted; never used in RLS or authorization.

The active business is **not** in the JWT. It is selected per request via an HTTP-only cookie set by a Server Action that verifies membership.

## 7. Verification: pgTAP tests

Each tenant-scoped table ships with at least:

1. A baseline "no cross-tenant read" test (User A cannot read business B's rows).
2. A "no cross-tenant write" test (User A cannot insert/update with another business's id).
3. A role-boundary test (e.g., `staff` cannot update settings).
4. A "platform admin can do X" test where applicable.

Tests live under [supabase/tests/rls/](../supabase/tests/rls/) and run via `supabase test db`. CI will fail if any policy regresses.

## 8. Migration checklist (per PR)

Before merging a migration that touches `public.*`:

- [ ] `enable row level security` on every new table.
- [ ] Policies cover `select`, `insert`, `update`, `delete` for every role that needs access.
- [ ] `with check` is set on `insert` and `update`.
- [ ] `business_id` is `not null` and references `businesses(id) on delete cascade` (if tenant-scoped).
- [ ] No `grant ... to anon` on the base table (use a view instead).
- [ ] pgTAP tests added covering at least cross-tenant isolation.
- [ ] `grant`/`revoke` reviewed for `anon` and `authenticated`.
