# Client / server boundary

## Client Components (`"use client"`)

- UI state and interactions
- Calling Route Handlers or Server Actions for mutations
- Supabase browser client with anon key only

## Server-only

- Authentication and session management
- Tenant provisioning and billing
- Service role Supabase operations
- Webhooks and cron jobs
- Validating permissions before any mutation

## Server Actions / Route Handlers

- Validate input with Zod (or similar) at the boundary
- Re-check authorization on every call — never trust the client alone
- Return minimal data — no internal IDs or secrets unless required
