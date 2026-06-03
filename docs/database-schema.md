# Database schema

PostgreSQL schema managed under `supabase/migrations/`. All tenant data is scoped by `business_id`.

## Migrations

| File | Contents |
|------|----------|
| `20260519100000_initial_schema.sql` | Core: `businesses`, `business_members`, `audit_logs`, RLS helpers |
| `20260525100000_platform_schema.sql` | Full platform tables, RLS, double-booking constraint |

## Tables

### Platform / tenant root

| Table | `business_id` | Notes |
|-------|---------------|-------|
| `businesses` | — | Tenant root; globally unique `slug` |
| `business_members` | ✓ | Links `auth.users` to businesses with role |
| `subscription_plans` | — | Platform catalog |
| `business_subscriptions` | ✓ | One active plan per business |
| `audit_logs` | optional | Append-only; service-role writes |

### Operations

| Table | `business_id` | Notes |
|-------|---------------|-------|
| `locations` | ✓ | Physical / virtual locations |
| `staff_members` | ✓ | Bookable resources |
| `services` | ✓ | Catalog; `numeric(12,2)` price + currency |
| `customers` | ✓ | Per-business customers |
| `app_settings` | ✓ | One row per business |
| `cancellation_policies` | ✓ | Cancellation rules |

### Scheduling (rule-based — no materialized slots)

| Table | `business_id` | Notes |
|-------|---------------|-------|
| `availability_rules` | ✓ | Weekly recurring windows |
| `availability_exceptions` | ✓ | One-off closures / hour changes |
| `slot_overrides` | ✓ | Manual block/open windows |
| `appointments` | ✓ | Bookings; exclusion constraint prevents staff overlap |

### Billing & notifications (ledger only)

| Table | `business_id` | Notes |
|-------|---------------|-------|
| `payments` | ✓ | No payment provider integration |
| `notification_logs` | ✓ | No SMS/WhatsApp provider |

## Key constraints

- **UUID** primary keys (`gen_random_uuid()`).
- **timestamptz** for all timestamps.
- **Money:** `numeric(12,2)` + `currency` text.
- **Double booking:** `appointments_no_staff_overlap` GiST exclusion on `staff_member_id` + time range for `pending`/`confirmed`.
- **Reserved slugs:** enforced by `app.normalize_slug()` + `app.is_reserved_slug()` (includes `preview`, `admin`, `dashboard`, etc.).

## RLS helpers (schema `app`)

| Function | Purpose |
|----------|---------|
| `app.is_platform_admin()` | JWT `app_metadata.platform_role = super_admin` |
| `app.is_member_of(business_id, roles?)` | Active membership check |
| `app.is_reserved_slug(text)` | Slug deny list |

All `SECURITY DEFINER` functions set `search_path` explicitly.

## Public read

- View `business_public` — active businesses, slug lookup for anon/authenticated.

## Seed

`supabase/seed.sql` — Demo Studio with services, staff, settings, availability rules, subscription plan.

## Types

Hand-maintained stub: `src/types/database.ts`. Regenerate after schema changes:

```bash
npm run supabase:types
```
