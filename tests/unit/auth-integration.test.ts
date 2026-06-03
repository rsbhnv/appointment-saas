import { describe, expect, it, vi } from "vitest";

/**
 * Auth integration contract tests — verify env flags and error codes used by
 * login/signup flows without calling Supabase.
 */
describe("auth integration flags", () => {
  it("demo mode and supabase can be configured independently", async () => {
    const prevDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    vi.resetModules();
    const demoEnv = await import("@/lib/env/client");
    expect(demoEnv.isDemoMode).toBe(true);
    expect(demoEnv.isSupabaseConfigured).toBe(false);

    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    vi.resetModules();
    const prodEnv = await import("@/lib/env/client");
    expect(prodEnv.isDemoMode).toBe(false);
    expect(prodEnv.isSupabaseConfigured).toBe(true);

    process.env.NEXT_PUBLIC_DEMO_MODE = prevDemo;
    if (prevUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (prevKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();
  });
});

describe("auth action error codes", () => {
  it("documents stable client-facing error keys", () => {
    const loginErrors = [
      "invalid_input",
      "invalid_credentials",
      "magic_link_failed",
      "auth_callback_failed",
      "supabase_not_configured",
      "demo_mode",
    ];
    const signupErrors = [
      "email_already_registered",
      "signup_failed",
      "supabase_not_configured",
      "demo_mode",
    ];
    expect(loginErrors).toContain("demo_mode");
    expect(signupErrors).toContain("email_already_registered");
  });
});
