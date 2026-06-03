# Supabase setup

Connect this project to your Supabase instance. All data flows through Supabase Auth and Postgres (RLS).

## 1. Create `.env.local` (never commit)

```powershell
copy .env.example .env.local
```

Edit `.env.local` locally (do not paste secrets into chat or commit the file):

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Project Settings** → **API** → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **anon public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → **service_role** secret (server only) |
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` |

Example project URL (public): `https://gufxjymouqzfkfsqwmnz.supabase.co.il`

## 2. Apply migrations

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, then:

```bash
supabase link --project-ref gufxjymouqzfkfsqwmnz
supabase db push
```

Or run migrations manually in the SQL editor from `supabase/migrations/`.

Seed data (optional, after migrations):

```bash
supabase db reset   # local only — applies migrations + seed.sql
```

## 3. Regenerate TypeScript types

After the schema is applied:

```bash
npm run supabase:types
```

This overwrites `src/types/database.ts` from the linked project.

## 4. Auth users for seeded business

`supabase/seed.sql` inserts **Demo Studio** (`demo-studio`) but not `business_members` (requires real `auth.users`).

1. Create users in Supabase Auth (Dashboard → Authentication).
2. Insert rows into `business_members` linking `user_id` to business `00000000-0000-0000-0000-00000000b001`.
3. Set `app_metadata.platform_role = 'super_admin'` for platform admins (server-set only).

## 5. Security checklist

- Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*`.
- All tenant queries filter by `business_id` from session/guards.
- RLS is enabled on every table — see `docs/database-schema.md`.
- Audit writes use the service role via `recordAuditEvent`.

## 6. Verify

```bash
npm run dev
npm run db:test    # RLS pgTAP tests (local Supabase)
npm run typecheck
npm run build
```
