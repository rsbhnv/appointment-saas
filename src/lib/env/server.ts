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
});

function shouldSkipValidation(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "true";
}

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    AUTH_SECRET: process.env.AUTH_SECRET || undefined,
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
