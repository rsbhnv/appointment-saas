/**
 * Reserved business slugs. Mirrors `app.is_reserved_slug` in the SQL migration.
 * Keep both lists in sync when changing.
 */
export const RESERVED_BUSINESS_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "app",
  "admin",
  "super-admin",
  "dashboard",
  "login",
  "logout",
  "signup",
  "signin",
  "auth",
  "callback",
  "billing",
  "pricing",
  "terms",
  "privacy",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "health",
  "www",
  "public",
  "static",
  "assets",
  "images",
  "img",
  "files",
  "cdn",
  "mail",
  "email",
  "sms",
  "webhooks",
  "webhook",
  "internal",
  "system",
  "settings",
  "account",
  "accounts",
  "me",
  "my",
  "user",
  "users",
  "business",
  "businesses",
  "customer",
  "customers",
  "staff",
  "service",
  "services",
  "book",
  "booking",
  "bookings",
  "appointment",
  "appointments",
  "preview",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export type SlugValidation =
  | { ok: true; slug: string }
  | { ok: false; reason: "format" | "length" | "reserved" | "consecutive-hyphen" };

export function validateBusinessSlug(input: string): SlugValidation {
  const slug = input.trim().toLowerCase();
  if (slug.length < 2 || slug.length > 64) return { ok: false, reason: "length" };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: "format" };
  if (slug.includes("--")) return { ok: false, reason: "consecutive-hyphen" };
  if (RESERVED_BUSINESS_SLUGS.has(slug)) return { ok: false, reason: "reserved" };
  return { ok: true, slug };
}
