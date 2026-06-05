import "server-only";

import { z } from "zod";

/**
 * Server-only environment variables.
 * Import only from Server Components, Route Handlers, Server Actions, or middleware.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

function shouldSkipValidation(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "true";
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

  return parsed.data;
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
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER,
  );
}

export function getTwilioConfig(): TwilioConfig | null {
  if (!isTwilioConfigured()) return null;
  return {
    accountSid: env.TWILIO_ACCOUNT_SID!,
    authToken: env.TWILIO_AUTH_TOKEN!,
    phoneNumber: env.TWILIO_PHONE_NUMBER!,
  };
}

export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
