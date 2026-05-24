# RLS tests (pgTAP)

Each file in this directory exercises Row Level Security policies on one table. Tests run inside transactions and `rollback` at the end, so they are safe against a real database.

Run via:

```bash
supabase test db
```

## Pattern

1. Begin a transaction and load `pgtap`.
2. Insert fixture rows using the service role (no RLS) via `set role postgres`.
3. Switch to `authenticated` role and set `request.jwt.claims` to simulate users.
4. Assert that allowed reads/writes succeed and forbidden ones fail.
5. `rollback`.

## Simulating users

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid>","app_metadata":{"platform_role":"super_admin"}}';
```

The `sub` claim is read by `auth.uid()`. `app_metadata.platform_role = 'super_admin'` triggers `app.is_platform_admin()` to return true.
