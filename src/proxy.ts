import { type NextRequest, NextResponse } from "next/server";

import { readDemoUserKeyFromRequest } from "@/lib/demo/session";
import { isDemoMode } from "@/lib/env/client";
import { applySecurityHeaders } from "@/lib/security/headers";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve";

const PROTECTED_PREFIXES = ["/dashboard", "/super-admin"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const initial = NextResponse.next({ request });
  applySecurityHeaders(initial);

  const { tenant, source } = resolveTenantFromRequest(request);
  if (tenant) {
    initial.headers.set("x-tenant-slug", tenant.slug);
    initial.headers.set("x-tenant-source", source);
  }

  let response = initial;
  let userId: string | null;

  if (isDemoMode) {
    userId = readDemoUserKeyFromRequest(request);
    response.headers.set("x-demo-mode", "1");
  } else {
    const session = await updateSupabaseSession(request, initial);
    response = session.response;
    applySecurityHeaders(response);
    userId = session.userId;
  }

  const { pathname, search } = request.nextUrl;

  if (!userId && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
