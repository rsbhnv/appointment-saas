/**
 * Public site configuration (no secrets).
 * Values can be overridden via NEXT_PUBLIC_* env vars at build time.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Appointment SaaS",
  description: "פלטפורמת SaaS לניהול תורים — תשתית מוכנה לפיתוח רב-דיירים.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000",
} as const;
