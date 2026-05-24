import "server-only";

import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import {
  DEMO_USERS,
  isDemoUserKey,
  type DemoSessionUser,
  type DemoUserKey,
} from "./fixtures";

export const DEMO_SESSION_COOKIE = "app.demo_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24,
};

/** Reads the demo user key from cookies in a Server Component / Action. */
export async function readDemoUserKey(): Promise<DemoUserKey | null> {
  const store = await cookies();
  const value = store.get(DEMO_SESSION_COOKIE)?.value;
  return isDemoUserKey(value) ? value : null;
}

/** Reads the demo user key from an incoming NextRequest (proxy/middleware). */
export function readDemoUserKeyFromRequest(request: NextRequest): DemoUserKey | null {
  const value = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  return isDemoUserKey(value) ? value : null;
}

export async function writeDemoUserKey(key: DemoUserKey): Promise<void> {
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, key, COOKIE_OPTIONS);
}

export async function clearDemoSession(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
}

/** Resolves the demo session user, or null when no demo cookie is present. */
export async function readDemoSessionUser(): Promise<DemoSessionUser | null> {
  const key = await readDemoUserKey();
  return key ? DEMO_USERS[key] : null;
}
