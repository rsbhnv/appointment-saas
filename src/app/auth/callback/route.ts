import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostLoginTarget } from "@/server/actions/post-login";

export const dynamic = "force-dynamic";

/**
 * OAuth + magic-link callback. Exchanges `code` for a session, then routes to
 * the role-appropriate landing page (or honours a safe `next` parameter).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const target = await resolvePostLoginTarget();
  return NextResponse.redirect(new URL(target.path, url.origin));
}
