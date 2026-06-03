import "server-only";

import { requireSession } from "@/server/guards";
import { findActiveMembershipsForUser } from "@/server/repositories/business-members";

export type PostLoginTarget =
  | { kind: "super_admin"; path: "/super-admin" }
  | { kind: "dashboard"; path: "/dashboard" }
  | { kind: "onboarding"; path: "/dashboard?empty=1" };

/**
 * Resolves the destination after a successful dashboard sign-in.
 * Customers use phone-based booking — no Supabase Auth for them.
 */
export async function resolvePostLoginTarget(): Promise<PostLoginTarget> {
  const user = await requireSession();
  if (user.platformRole === "super_admin") {
    return { kind: "super_admin", path: "/super-admin" };
  }

  const memberships = await findActiveMembershipsForUser(user.id);
  if (memberships.length > 0) {
    return { kind: "dashboard", path: "/dashboard" };
  }

  return { kind: "onboarding", path: "/dashboard?empty=1" };
}
