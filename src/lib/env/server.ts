import "server-only";

import { z } from "zod";

/**
 * Server-only environment variables.
 * Import only from Server Components, Route Handlers, Server Actions, or middleware.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

function shouldSkipValidation(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "true";
}

const CRON_SECRET_MIN_LENGTH = 16;
const AUTH_SECRET_MIN_LENGTH = 32;

function normalizeOptionalSecret(
  name: string,
  value: string | undefined,
  minLength: number,
): string | undefined {
  if (!value) return undefined;
  if (value.length < minLength) {
    console.warn(
      `[env] ${name} must be at least ${minLength} characters — related features stay disabled until fixed.`,
    );
    return undefined;
  }
  return value;
}

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    AUTH_SECRET: process.env.AUTH_SECRET || undefined,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || undefined,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || undefined,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
  });

  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten());
    throw new Error("Invalid server environment variables");
  }

  return {
    ...parsed.data,
    AUTH_SECRET: normalizeOptionalSecret(
      "AUTH_SECRET",
      parsed.data.AUTH_SECRET,
      AUTH_SECRET_MIN_LENGTH,
    ),
    CRON_SECRET: normalizeOptionalSecret(
      "CRON_SECRET",
      parsed.data.CRON_SECRET,
      CRON_SECRET_MIN_LENGTH,
    ),
  };
}

const env = parseServerEnv();

if (env.NODE_ENV === "production" && !shouldSkipValidation() && !env.AUTH_SECRET) {
  console.warn(
    "[env] AUTH_SECRET is not set. Required before handling authenticated traffic in production.",
  );
}

export const serverEnv = env;

export const isSupabaseAdminConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
};

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !phoneNumber) return null;
  return { accountSid, authToken, phoneNumber };
}

if (env.NODE_ENV === "development" && !shouldSkipValidation() && !isTwilioConfigured()) {
  console.warn(
    "[env] Twilio SMS is not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.local, then restart the dev server.",
  );
}

if (env.NODE_ENV === "production" && !shouldSkipValidation() && !isTwilioConfigured()) {
  console.warn(
    "[env] Twilio SMS is not configured in production — booking confirmation SMS will be skipped until TWILIO_* env vars are set on Vercel.",
  );
}

export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
