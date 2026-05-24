"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearDemoSession } from "@/lib/demo/session";
import { clientEnv, isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearActiveBusinessCookie } from "@/lib/tenant/active-business";

export type AuthResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; error: string };

function demoBlocked(): AuthResult {
  return { ok: false, error: "demo_mode" };
}

const EmailPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
});

const MagicLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

function callbackUrl(next?: string): string {
  const base = clientEnv.NEXT_PUBLIC_APP_URL;
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `${base}/auth/callback${qs ? `?${qs}` : ""}`;
}

export async function signInWithPassword(input: unknown): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  const parsed = EmailPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "invalid_credentials" };

  return { ok: true };
}

export async function signInWithMagicLink(input: unknown): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  const parsed = MagicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl() },
  });
  if (error) return { ok: false, error: "magic_link_failed" };

  return { ok: true };
}

export async function signInWithGoogle(next?: string): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) return { ok: false, error: "oauth_failed" };
  return { ok: true, redirectUrl: data.url };
}

export async function signOut(): Promise<never> {
  if (isDemoMode) {
    await clearDemoSession();
    await clearActiveBusinessCookie();
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearActiveBusinessCookie();
  redirect("/login");
}
