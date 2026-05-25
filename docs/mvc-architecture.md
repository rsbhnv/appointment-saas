# MVC architecture (Next.js App Router)

Adapted MVC for this SaaS — boundaries enforced by Cursor rules and folder layout.

## Layers

```
Views          →  src/app/**, src/components/**
Controllers    →  src/server/actions/**, src/app/**/route.ts
Services       →  src/server/services/**
Repositories   →  src/server/repositories/**
Models         →  supabase/migrations/, src/types/database.ts
```

## Views

React Server/Client Components, layouts, pages. **No Supabase imports.** Data via Server Components calling services/guards, or Server Actions.

## Controllers

- **Server Actions** (`src/server/actions/*`) — mutations, auth flows; Zod at boundary.
- **Route Handlers** (`src/app/**/route.ts`) — webhooks, OAuth callback, health.

Controllers: authenticate → authorize → validate → call service → return result.

## Services

| Service | File | Role |
|---------|------|------|
| Auth | `auth.service.ts` | Session / landing resolution |
| Tenant | `tenant.service.ts` | Active business context |
| Booking | `booking.service.ts` | Appointment orchestration (read-only v1) |
| Slot engine | `slot-engine.service.ts` | Rule-based availability (compute deferred) |
| Audit | `audit.ts`, `with-audit.ts` | Append-only audit trail |

Business rules live here — not in repositories or UI.

## Repositories

Barrel: `src/server/repositories/index.ts`

| Export | Module | Tables |
|--------|--------|--------|
| `businessRepository` | `businesses.ts` | `businesses`, `business_public` |
| `businessMemberRepository` | `business-members.ts` | `business_members` |
| `serviceRepository` | `services.ts` | `services` |
| `staffRepository` | `staff-members.ts` | `staff_members` |
| `customerRepository` | `customers.ts` | `customers` |
| `appointmentRepository` | `appointments.ts` | `appointments` |
| `availabilityRepository` | `availability.ts` | rules, exceptions, `slot_overrides` |
| `auditLogRepository` | `audit-logs.ts` | `audit_logs` |
| `appSettingsRepository` | `app-settings.ts` | `app_settings` |
| `locationRepository` | `locations.ts` | `locations` |

Every repository branches on `isDemoMode()`:

- **Demo:** `src/lib/demo/*` in-memory stores
- **Production:** `createSupabaseServerClient()` (RLS) or admin client for audit inserts

## Models

- **SQL migrations** — source of truth for schema, RLS, constraints.
- **`src/types/database.ts`** — generated/hand-written DB types.
- **Domain types** — e.g. `src/types/tenant.ts`, guard types in `src/server/guards/`.

## Demo mode

`NEXT_PUBLIC_DEMO_MODE=true` keeps UI working without Supabase. Switching to production is an env change only — repositories select the backend.

## Security rules (summary)

1. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
2. Re-derive `business_id` from session — never trust client payload.
3. RLS on all tables; app-level filters are defense in depth.
4. Mutations: Zod + guards + audit for sensitive actions.

See also: `.cursor/rules/supabase-production.mdc`, `docs/supabase-setup.md`.
