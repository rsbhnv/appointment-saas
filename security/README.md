# Security policies

This directory documents security expectations for the multi-tenant SaaS platform.

Runtime policy definitions live in `src/lib/security/rules/` and are imported by server code as needed.

## Principles

1. **Secrets stay server-side** — Never use `NEXT_PUBLIC_` for keys that bypass RLS or grant elevated access.
2. **Default deny** — Authorization must explicitly allow each action.
3. **Tenant isolation** — Every tenant-scoped resource is filtered by `tenant_id` at the database (RLS) and application layers.
4. **Defense in depth** — Headers, middleware session refresh, RLS, and server-side validation work together.

## Policy files

| File                                 | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| `policies/server-only-secrets.md`    | Which env vars must never reach the browser |
| `policies/tenant-isolation.md`       | Multi-tenant data boundaries                |
| `policies/client-server-boundary.md` | What runs where                             |

## Before production

- [ ] Configure Supabase RLS for all tables
- [ ] Set `AUTH_SECRET` and rotate periodically
- [ ] Enable HTTPS and verify HSTS headers
- [ ] Review CSP (add when third-party scripts are known)
- [ ] Set up audit logging for admin/service-role actions
