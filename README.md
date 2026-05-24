# Appointment SaaS

Production-ready **Next.js** scaffold for a multi-tenant appointment SaaS (Hebrew-first, RTL-ready). This repository contains infrastructure only — no booking logic, database schema, or product features yet.

## Stack

| Layer         | Choice                                |
| ------------- | ------------------------------------- |
| Framework     | Next.js 16 (App Router)               |
| Language      | TypeScript                            |
| Styling       | Tailwind CSS v4 + shadcn/ui           |
| Backend-ready | Supabase (`@supabase/ssr`)            |
| Lint / format | ESLint + Prettier                     |
| PWA           | Manifest + service worker placeholder |

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase](https://supabase.com) project (when connecting auth/data)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — add Supabase keys and AUTH_SECRET for production

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local`. Never commit secrets.

| Variable                        | Exposure        | Description                     |
| ------------------------------- | --------------- | ------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Public          | Canonical app URL               |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public          | Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public          | Anon key (RLS required)         |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server only** | Bypasses RLS — system jobs only |
| `AUTH_SECRET`                   | **Server only** | Session signing (min 32 chars)  |

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

For CI scaffold builds without secrets: `SKIP_ENV_VALIDATION=true`.

## Scripts

| Command             | Description             |
| ------------------- | ----------------------- |
| `npm run dev`       | Start dev server        |
| `npm run build`     | Production build        |
| `npm run start`     | Start production server |
| `npm run lint`      | ESLint                  |
| `npm run format`    | Prettier write          |
| `npm run typecheck` | TypeScript check        |

## Project structure

```
src/
├── app/
│   ├── (marketing)/          # Public marketing shell
│   ├── (platform)/           # Tenant / app area (placeholder)
│   ├── api/health/           # Health check route
│   ├── layout.tsx            # Root: RTL, Hebrew, providers
│   └── manifest.ts           # PWA manifest
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/               # App shell, header, footer
│   ├── design-system/        # Typography + token showcase
│   ├── providers/            # Theme + app providers
│   └── pwa/                  # Service worker registration
├── config/                   # Site + i18n config (no secrets)
├── lib/
│   ├── env/                  # Client vs server env validation
│   ├── supabase/             # Browser, server, admin clients
│   ├── tenant/               # Multi-tenant resolution (stub)
│   └── security/             # Headers + policy rules
├── types/                    # Shared TypeScript types
└── middleware.ts             # Security headers, session, tenant hints

security/                     # Human-readable security policies
public/icons/                 # PWA icons (add before enabling PWA)
```

## Supabase

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. For server-side admin tasks, set `SUPABASE_SERVICE_ROLE_KEY` (never expose to the client).

Client factories:

- **Browser**: `createSupabaseBrowserClient()` — anon key, RLS enforced
- **Server**: `createSupabaseServerClient()` — cookie session
- **Admin**: `createSupabaseAdminClient()` — service role, `server-only`

Add RLS policies when you introduce tables. See `security/policies/tenant-isolation.md`.

## Multi-tenant

Tenant resolution stub: subdomain `{slug}.{NEXT_PUBLIC_ROOT_DOMAIN}` via `src/lib/tenant/resolve.ts`. Middleware sets `x-tenant-slug` for downstream server code. Wire to your database when ready.

## Security

- Policy definitions: `src/lib/security/rules/`
- Documentation: `security/`
- HTTP security headers in `next.config.ts` and middleware
- Service role and `AUTH_SECRET` are server-only (`import "server-only"`)

## RTL & Hebrew

- Default locale: `he`, direction `rtl` on `<html>`
- Font: Heebo (Hebrew + Latin)
- shadcn/ui RTL enabled in `components.json`
- Add full i18n routing later under `src/config/i18n.ts`

## PWA

1. Add icons to `public/icons/` (see `public/icons/README.md`).
2. Set `NEXT_PUBLIC_ENABLE_PWA=true` in production when ready.
3. Implement caching in `public/sw.js` or adopt Serwist.

## What is intentionally missing

- Booking / scheduling features
- Database migrations or schema
- Authentication UI and flows
- Billing and payments
- Product business logic

Build those on top of this foundation.

## License

Private — all rights reserved unless otherwise specified.
