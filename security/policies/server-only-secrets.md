# Server-only secrets

The following must **never** be prefixed with `NEXT_PUBLIC_` or imported in Client Components:

| Variable                    | Purpose                               |
| --------------------------- | ------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS — system operations only |
| `AUTH_SECRET`               | Session signing / encryption          |

## Allowed in the browser

| Variable                        | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — **RLS must protect all data** |

## Code locations

- Browser Supabase: `src/lib/supabase/client.ts`
- Server session client: `src/lib/supabase/server.ts`
- Admin client: `src/lib/supabase/admin.ts` (imports `server-only`)
