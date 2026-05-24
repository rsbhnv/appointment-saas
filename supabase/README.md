# Supabase

Database schema, RLS policies, and pgTAP tests for the appointment SaaS.

## Layout

```
supabase/
  config.toml             Local Supabase CLI config
  seed.sql                Optional development seed (empty in Phase 1)
  migrations/             Timestamped SQL migrations (source of truth)
  tests/rls/              pgTAP tests; one file per table
```

## Common commands

```bash
# Local stack (Docker required)
supabase start
supabase db reset           # drops + re-applies migrations + seed

# Remote project
supabase link --project-ref <ref>
supabase db push            # apply pending migrations
supabase gen types typescript --linked > src/types/database.ts

# RLS tests
supabase test db
```

Generated TypeScript types live at [`src/types/database.ts`](../src/types/database.ts). In Phase 1 the file is hand-written from the migration; replace it via `npm run supabase:types` once a remote project is linked.

## Naming policy

- Tenant-scoped tables include `business_id uuid not null references businesses(id) on delete cascade`.
- The override table introduced in Phase 3 is named `slot_overrides`. **Never** `available_slots` — see [`docs/architecture.md`](../docs/architecture.md) §6.
- All names are generic SaaS vocabulary. No `clinic`, `doctor`, `patient`, etc.
