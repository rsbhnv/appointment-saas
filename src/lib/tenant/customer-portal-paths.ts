import { siteConfig } from "@/config/site";

/** First path segments that are app routes, not business slugs. */
const RESERVED_ROOT_SEGMENTS = new Set([
  "api",
  "auth",
  "b",
  "dashboard",
  "login",
  "preview",
  "privacy",
  "signup",
  "super-admin",
  "terms",
]);

/** Public customer booking page: `/{slug}/book` */
export function customerBookingPath(slug: string): string {
  return `/${slug}/book`;
}

/** Customer appointments lookup: `/{slug}/my-appointments` */
export function customerMyAppointmentsPath(slug: string): string {
  return `/${slug}/my-appointments`;
}

export function isCustomerPortalPath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  if (pathname.startsWith("/b/")) return true;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const page = segments[1];
  if (page !== "book" && page !== "my-appointments") return false;
  return !RESERVED_ROOT_SEGMENTS.has(segments[0]!);
}

export function isCustomerBookingPath(pathname: string): boolean {
  return isCustomerPortalPath(pathname) && pathname.includes("/book");
}

export function customerBookingUrl(slug: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${customerBookingPath(slug)}`;
}

/** Legacy portal path — redirects to {@link customerBookingPath}. */
export function legacyCustomerPortalPath(slug: string): string {
  return `/b/${slug}`;
}
