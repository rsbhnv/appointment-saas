import "server-only";

import { readDemoSessionUser } from "@/lib/demo/session";
import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuardError } from "./errors";

export type SessionUser = {
  id: string;
  email: string | null;
  platformRole: "super_admin" | null;
};

/**
 * Returns the authenticated user or throws `GuardError("unauthenticated")`.
 * Callers in route segments should catch and redirect to /login.
 *
 * Demo mode: resolves from the demo session cookie instead of Supabase.
 */
export async function requireSession(): Promise<SessionUser> {
  if (isDemoMode) {
    const demoUser = await readDemoSessionUser();
    if (!demoUser) throw new GuardError("unauthenticated");
    return {
      id: demoUser.id,
      email: demoUser.email,
      platformRole: demoUser.platformRole,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new GuardError("unauthenticated");
  }

  const claim = (user.app_metadata as Record<string, unknown> | undefined)
    ?.platform_role;

  return {
    id: user.id,
    email: user.email ?? null,
    platformRole: claim === "super_admin" ? "super_admin" : null,
  };
}

/** Non-throwing variant for layouts that need to render either way. */
export async function tryGetSession(): Promise<SessionUser | null> {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}
