"use server";

import { z } from "zod";

import { verifyDemoCredentials } from "@/lib/demo/credentials";
import {
  DEMO_USERS,
  DEMO_USER_KEYS,
  type DemoUserKey,
} from "@/lib/demo/fixtures";
import { clearDemoSession, writeDemoUserKey } from "@/lib/demo/session";
import { isDemoMode } from "@/lib/env/client";
import { clearActiveBusinessCookie } from "@/lib/tenant/active-business";
import { recordAuditEvent } from "@/server/services/audit";

export type DemoAuthResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

const DemoUserSchema = z.enum(DEMO_USER_KEYS);

const PasswordSchema = z.object({
  phone: z.string().min(3).max(40),
  password: z.string().min(1).max(128),
});

const REDIRECT_BY_ROLE: Record<DemoUserKey, string> = {
  super_admin: "/super-admin",
  business_owner: "/dashboard",
  staff: "/dashboard",
};

async function establishDemoSession(
  key: DemoUserKey,
  via: string,
): Promise<void> {
  await clearActiveBusinessCookie();
  await writeDemoUserKey(key);
  void recordAuditEvent({
    action: "demo.signed_in",
    userId: DEMO_USERS[key].id,
    metadata: { role: key, via },
  });
}

/**
 * Signs in as a fixture user via the quick role buttons.
 * Writes the demo session cookie and returns the role-appropriate landing URL.
 */
export async function signInAsDemoUser(
  input: unknown,
): Promise<DemoAuthResult> {
  if (!isDemoMode) {
    return { ok: false, error: "demo_mode_disabled" };
  }
  const parsed = DemoUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }
  const key = parsed.data;
  await establishDemoSession(key, "button");
  return { ok: true, redirectUrl: REDIRECT_BY_ROLE[key] };
}

/**
 * Phone + password demo login.
 * Credentials live in env vars (DEMO_*_PHONE / DEMO_*_PASSWORD); see
 * `src/lib/demo/credentials.ts`. Returns generic failure on mismatch so the
 * server doesn't leak which slot the user attempted.
 */
export async function signInWithDemoPassword(
  input: unknown,
): Promise<DemoAuthResult> {
  if (!isDemoMode) {
    return { ok: false, error: "demo_mode_disabled" };
  }
  const parsed = PasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }
  const key = verifyDemoCredentials(parsed.data.phone, parsed.data.password);
  if (!key) {
    return { ok: false, error: "invalid_credentials" };
  }
  await establishDemoSession(key, "password");
  return { ok: true, redirectUrl: REDIRECT_BY_ROLE[key] };
}

/** Clears the demo session cookie. Safe to call in production (no-op there). */
export async function signOutDemo(): Promise<void> {
  await clearDemoSession();
}
