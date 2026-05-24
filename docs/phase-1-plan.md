# Phase 1 — Foundation

Scope locked. No booking UI, no payment providers, no notification providers in this phase. `available_slots` is **not** introduced here; it appears in Phase 3 and only as an override table.

## Goals

Deliver a runnable, locked-down foundation that the rest of the product can be built on without revisiting:

1. Supabase project structure + migrations workflow.
2. Core tables: `businesses`, `business_members`, `audit_logs`.
3. RLS policies and pgTAP tests on those three tables.
4. Auth flows: Google OAuth, email + password, magic link.
5. Server-side guards: `requireSession`, `requireBusinessMember`, `requirePlatformAdmin`.
6. Tenant helpers: active-business cookie, context resolver.
7. Audit logging helper + `withAudit` wrapper.
8. Login page shell and post-login redirect.
9. Protected `/dashboard` shell.
10. Vitest setup + a few unit tests on guards and audit helpers.

## Non-goals (deferred)

- Service, staff, customer, availability, appointment tables (Phase 2+).
- Public booking UI (Phase 4).
- FullCalendar (Phase 5).
- Notification providers (Phase 7).
- Payments (Phase 10).
- Customer OTP (Phase 10).
- Locale routing via `next-intl` (Phase 9). Hebrew-first strings stay in-place for Phase 1.

## Deliverables and step order

Implementation runs as a sequence of small, verifiable steps. After every step: `npm run typecheck`, `npm run lint`, and (where applicable) `npm run test`.

### Step 1 — Docs

- `docs/architecture.md` — overall architecture reference.
- `docs/rls-strategy.md` — RLS principles + policy patterns + migration checklist.
- `docs/phase-1-plan.md` — this document.

### Step 2 — Supabase project tooling

- Create `supabase/` with `config.toml`, `migrations/`, `tests/rls/`, `seed.sql`.
- Document how to apply migrations locally vs. against a hosted project.
- Add npm scripts: `supabase:types` (regenerates `src/types/database.ts`), `db:test` (runs pgTAP suite).
- No business logic yet.

### Step 3 — Initial migration

`supabase/migrations/<timestamp>_initial_schema.sql` creates:

- Extensions: `pgcrypto`, `btree_gist` (used later — declared upfront), `uuid-ossp`.
- Schema `app` with helper functions (`is_member_of`, `is_platform_admin`, `is_reserved_slug`, `set_updated_at`).
- Enums: `business_status`, `member_role`, `member_status`.
- Tables: `businesses`, `business_members`, `audit_logs`.
- `updated_at` trigger function in `app`.
- `businesses` slug trigger: lowercases input, validates format, rejects reserved words via `app.is_reserved_slug`.
- `UNIQUE` constraint on `businesses.slug` (globally unique).
- View `public.business_public`.
- RLS enabled on all three tables.
- Policies per the patterns in `docs/rls-strategy.md`.
- `grant`/`revoke` setup for `anon` and `authenticated`.
- No `SECURITY DEFINER` user functions in this phase. The helper functions in `app.*` are `SECURITY DEFINER` only where they must read auth state; each uses an explicit `search_path` and is grant-restricted per `docs/rls-strategy.md`.

Naming note: when Phase 3 introduces the override table for manual slots, it will be named `slot_overrides` (not `available_slots`). The name is reserved here to prevent future drift toward materialized inventory.

### Step 4 — Generated types

- Generate `src/types/database.ts` from the migration. For Phase 1 this is a hand-written stub matching the SQL schema; once a Supabase project exists, the script `npm run supabase:types` overwrites it from the live DB.
- All Supabase clients in [src/lib/supabase/](../src/lib/supabase/) get typed via `Database`.

### Step 5 — pgTAP tests

Under `supabase/tests/rls/`:

- `businesses.test.sql` — cross-tenant isolation + platform admin access.
- `business_members.test.sql` — owner-only writes, self-read for staff.
- `audit_logs.test.sql` — no anon access, admin read, no client writes.

Each test wraps in a transaction with `rollback` and uses `set request.jwt.claims` to simulate different users.

### Step 6 — Tenant + role helpers

- `src/lib/auth/roles.ts` — role constants + permission helpers (pure).
- `src/lib/tenant/reserved-slugs.ts` — reserved-word array shared with the SQL trigger.
- `src/lib/tenant/active-business.ts` — read/set the active-business cookie (server-only).
- `src/server/guards/session.ts` — `requireSession()`.
- `src/server/guards/business-member.ts` — `requireBusinessMember(roles?)`.
- `src/server/guards/platform-admin.ts` — `requirePlatformAdmin()`.
- `src/server/guards/index.ts` — barrel.

### Step 7 — Audit service

- `src/server/services/audit.ts` — `recordAuditEvent({ businessId, action, entityType, entityId, metadata })`.
- `src/server/services/with-audit.ts` — wrapper around Server Actions that records after success and never blocks the action on logging failure (logs the logging failure separately).

### Step 8 — Repositories (read-only in Phase 1)

- `src/server/repositories/businesses.ts` — `findBySlug`, `findById`, `listForUser` (all RLS-protected).
- `src/server/repositories/business-members.ts` — `findByUser`, `findActiveForBusiness`.

No mutations exposed in Phase 1 — those land with Phase 2's CRUD UIs.

### Step 9 — Auth foundation

- `src/server/actions/auth.ts` — Server Actions:
  - `signInWithPassword({ email, password })`
  - `signInWithMagicLink({ email })`
  - `signInWithGoogle()` (returns the OAuth URL)
  - `signOut()`
- All actions return a discriminated-union result (`{ ok: true } | { ok: false, error }`) — never throw across the boundary.

### Step 10 — Routes

- `src/app/(auth)/login/page.tsx` — Server Component shell.
- `src/app/(auth)/login/login-form.tsx` — Client Component, mobile-first, RTL.
- `src/app/(auth)/callback/route.ts` — Supabase code-exchange.
- `src/app/(auth)/auth-code-error/page.tsx` — graceful failure.
- `src/app/(dashboard)/dashboard/layout.tsx` — protected layout, calls `requireSession` + active-business resolution; renders sidebar shell.
- `src/app/(dashboard)/dashboard/page.tsx` — placeholder welcome panel.
- `src/app/(super-admin)/super-admin/layout.tsx` — protected by `requirePlatformAdmin`, minimal shell.
- Removes the temporary `src/app/(platform)/...` placeholder from the scaffold.

### Step 11 — Middleware → proxy (Next.js 16)

- Rename `src/middleware.ts` to `src/proxy.ts` if Next.js 16 docs confirm the rename (verified against `node_modules/next/dist/docs/`).
- Extend it to:
  - Refresh the Supabase session (already in place).
  - Apply security headers (already in place).
  - Redirect unauthenticated requests away from `/dashboard/**` and `/super-admin/**`.
  - Redirect authenticated users on `/login` to the appropriate landing.

### Step 12 — Tests

- Install Vitest as devDep.
- `vitest.config.ts` with `node` environment, path alias `@/*`.
- Unit tests:
  - `tests/unit/roles.test.ts` — permission helpers.
  - `tests/unit/with-audit.test.ts` — wrapper behaviour on success and failure.
- Add `npm run test` and `npm run test:watch` scripts.

### Step 13 — Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual smoke: dev server boots, `/login` renders, `/dashboard` redirects to `/login` when signed out.

## What is explicitly **not** included in Phase 1

- No `services`, `staff_members`, `customers`, `appointments`, `availability_rules`, `availability_exceptions`, `available_slots`, `payments`, `notification_logs`, `cancellation_policies`, `app_settings`, `subscription_plans`, `business_subscriptions` tables.
- No booking flow code path.
- No FullCalendar integration.
- No notification adapter or mock provider.
- No payment provider or webhook stubs.
- No locale routing.

## Exit criteria

Phase 1 is done when:

- The migration runs cleanly against a fresh Supabase project.
- All pgTAP tests in `supabase/tests/rls/` pass.
- Typecheck, lint, unit tests, and production build pass.
- A user can sign in via Google or magic link (assuming env vars are configured) and reach `/dashboard`.
- An unauthenticated request to `/dashboard` is redirected to `/login`.
- A user with no `business_members` row reaches `/dashboard` and sees the empty state — without leaking other tenants' data.

After exit, Phase 2 begins: business setup (locations, staff, services, settings, branding fields).
