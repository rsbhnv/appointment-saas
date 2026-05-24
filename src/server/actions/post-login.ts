import "server-only";

import { requireSession } from "@/server/guards";
import { findActiveMembershipsForUser } from "@/server/repositories/business-members";

export type PostLoginTarget =
  | { kind: "super_admin"; path: "/super-admin" }
  | { kind: "dashboard"; path: "/dashboard" }
  | { kind: "onboarding"; path: "/dashboard?empty=1" };

/**
 * Resolves the destination after a successful sign-in.
 *
 * - Platform super admins go to /super-admin.
 * - Users with at least one active business go to /dashboard.
 * - Users with no membership land on /dashboard?empty=1 (empty state).
 */
export async function resolvePostLoginTarget(): Promise<PostLoginTarget> {
  const user = await requireSession();
  if (user.platformRole === "super_admin") {
    return { kind: "super_admin", path: "/super-admin" };
  }

  const memberships = await findActiveMembershipsForUser(user.id);
  if (memberships.length === 0) {
    return { kind: "onboarding", path: "/dashboard?empty=1" };
  }
  return { kind: "dashboard", path: "/dashboard" };
}
