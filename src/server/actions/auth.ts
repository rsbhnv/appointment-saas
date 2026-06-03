"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearDemoSession } from "@/lib/demo/session";
import { clientEnv, isDemoMode, isSupabaseConfigured } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearActiveBusinessCookie } from "@/lib/tenant/active-business";
import { resolvePostLoginTarget } from "@/server/actions/post-login";
import { requireSession } from "@/server/guards/session";

export type AuthResult =
  | { ok: true; redirectUrl?: string; needsEmailConfirmation?: boolean }
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

const ResetPasswordRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

const UpdatePasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

function callbackUrl(next?: string): string {
  const base = clientEnv.NEXT_PUBLIC_APP_URL;
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `${base}/auth/callback${qs ? `?${qs}` : ""}`;
}

async function postLoginRedirect(next?: string): Promise<string> {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  const target = await resolvePostLoginTarget();
  return target.path;
}

export async function signInWithPassword(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = EmailPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "invalid_credentials" };

  return { ok: true, redirectUrl: await postLoginRedirect(next) };
}

export async function signUpWithPassword(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = EmailPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: callbackUrl(next) },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already registered") || message.includes("already exists")) {
      return { ok: false, error: "email_already_registered" };
    }
    return { ok: false, error: "signup_failed" };
  }

  if (data.session) {
    return { ok: true, redirectUrl: await postLoginRedirect(next) };
  }

  return { ok: true, needsEmailConfirmation: true };
}

export async function signInWithMagicLink(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = MagicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl(next),
      shouldCreateUser: true,
    },
  });
  if (error) return { ok: false, error: "magic_link_failed" };

  return { ok: true };
}

export async function requestPasswordReset(input: unknown): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = ResetPasswordRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/login/reset-password"),
  });
  if (error) return { ok: false, error: "reset_request_failed" };

  return { ok: true };
}

export async function updatePassword(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = UpdatePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: "update_password_failed" };

  return { ok: true, redirectUrl: await postLoginRedirect(next) };
}

/** Change password while signed in (settings). Verifies current password first. */
export async function changePasswordAction(input: unknown): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { ok: false, error: "same_password" };
  }

  const user = await requireSession();
  if (!user.email) return { ok: false, error: "unauthenticated" };

  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) return { ok: false, error: "invalid_current_password" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) return { ok: false, error: "update_password_failed" };

  return { ok: true };
}

/** Reserved for when Google OAuth is enabled in Supabase — not used in UI yet. */
export async function signInWithGoogle(next?: string): Promise<AuthResult> {
  if (isDemoMode) return demoBlocked();
  if (!isSupabaseConfigured) return { ok: false, error: "supabase_not_configured" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) return { ok: false, error: "oauth_failed" };
  return { ok: true, redirectUrl: data.url };
}

function safeReturnPath(path: string | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
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

/** Signs out and opens login with a safe `next` path (e.g. customer booking page). */
export async function signOutToLogin(returnPath: string): Promise<never> {
  const next = safeReturnPath(returnPath);
  if (isDemoMode) {
    await clearDemoSession();
    await clearActiveBusinessCookie();
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearActiveBusinessCookie();
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
