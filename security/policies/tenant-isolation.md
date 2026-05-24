# Tenant isolation

## Resolution

Tenants are identified from the request (subdomain today; path/header later). See `src/lib/tenant/resolve.ts`.

## Rules

1. Authenticated users may only access resources for their bound tenant.
2. Database queries include `tenant_id` (or equivalent) in every filter.
3. Supabase RLS policies enforce isolation even if application code regresses.
4. Platform-level admins use a separate role and code path — not tenant admin roles.

## Future implementation

When adding tables:

- Add `tenant_id` UUID column to all tenant-scoped tables
- Create RLS policies: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`
- Never trust client-supplied `tenant_id` without verifying against the session
