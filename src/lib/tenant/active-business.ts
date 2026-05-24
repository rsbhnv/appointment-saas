import "server-only";

import { cookies } from "next/headers";

export const ACTIVE_BUSINESS_COOKIE = "app.active_business";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Returns the active business id stored in the cookie, or null if not set. */
export async function readActiveBusinessCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ACTIVE_BUSINESS_COOKIE)?.value;
  if (!value) return null;
  return isUuid(value) ? value : null;
}

export async function writeActiveBusinessCookie(businessId: string): Promise<void> {
  if (!isUuid(businessId)) throw new Error("invalid business id");
  const store = await cookies();
  store.set(ACTIVE_BUSINESS_COOKIE, businessId, COOKIE_OPTIONS);
}

export async function clearActiveBusinessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_BUSINESS_COOKIE);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
