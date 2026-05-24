import { z } from "zod";

/**
 * Public environment variables — safe to use in Client Components.
 * Only variables prefixed with NEXT_PUBLIC_ belong here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Appointment SaaS"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["he", "en"]).default("he"),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1).default("localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
});

function parseClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || undefined,
  });

  if (!parsed.success) {
    console.error("Invalid public environment variables:", parsed.error.flatten());
    throw new Error("Invalid public environment variables");
  }

  return parsed.data;
}

export const clientEnv = parseClientEnv();

export const isSupabaseConfigured = Boolean(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Demo mode runs the app against in-memory fixtures with no Supabase
 * dependency. The flag is public on purpose — UI must be able to render
 * demo affordances (badge, demo login buttons).
 */
export const isDemoMode = clientEnv.NEXT_PUBLIC_DEMO_MODE;
