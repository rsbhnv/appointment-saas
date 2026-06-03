import { NextResponse, type NextRequest } from "next/server";

import { isCustomerPortalPath } from "@/lib/tenant/customer-portal-paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostLoginTarget } from "@/server/actions/post-login";

export const dynamic = "force-dynamic";

function loginRedirect(origin: string, error: string, next?: string | null) {
  const params = new URLSearchParams({ error });
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next);
  }
  return NextResponse.redirect(new URL(`/login?${params.toString()}`, origin));
}

/**
 * Magic-link + OAuth callback for dashboard users only.
 * Customers use phone-based booking — they should not reach this route.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const errorCode = url.searchParams.get("error");
  const authError = url.searchParams.get("error_description");

  if (next && isCustomerPortalPath(next)) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (
    errorCode === "otp_expired" ||
    errorCode === "access_denied" ||
    authError?.toLowerCase().includes("expired") ||
    authError?.toLowerCase().includes("invalid")
  ) {
    return loginRedirect(url.origin, "otp_expired", next);
  }

  if (authError || errorCode) {
    return loginRedirect(url.origin, "magic_link_failed", next);
  }

  if (!code) {
    return loginRedirect(url.origin, "auth_callback_failed", next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("expired") || message.includes("invalid")) {
      return loginRedirect(url.origin, "otp_expired", next);
    }
    return loginRedirect(url.origin, "auth_callback_failed", next);
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const target = await resolvePostLoginTarget();
  return NextResponse.redirect(new URL(target.path, url.origin));
}
