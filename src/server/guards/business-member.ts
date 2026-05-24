import "server-only";

import { hasMinimumRole } from "@/lib/auth/roles";
import { readActiveBusinessCookie } from "@/lib/tenant/active-business";
import type { MemberRole } from "@/types/database";

import { findActiveMembershipsForUser } from "@/server/repositories/business-members";
import { GuardError } from "./errors";
import { requireSession, type SessionUser } from "./session";

export type BusinessMembership = {
  businessId: string;
  role: MemberRole;
  permissions: Record<string, unknown>;
};

export type BusinessContext = {
  user: SessionUser;
  membership: BusinessMembership;
};

export type RequireBusinessMemberOptions = {
  /** If set, the resolved membership's role must be at least this rank. */
  minimumRole?: MemberRole;
};

/**
 * Resolves the active business for the signed-in user and asserts the
 * membership is at least the requested role.
 *
 * Resolution order:
 *   1. Active-business cookie, if it points to a current membership.
 *   2. Single membership, when the user belongs to exactly one business.
 *   3. Otherwise, throw `no_business_membership` (caller can prompt picker).
 */
export async function requireBusinessMember(
  options: RequireBusinessMemberOptions = {},
): Promise<BusinessContext> {
  const user = await requireSession();
  const memberships = await findActiveMembershipsForUser(user.id);

  if (memberships.length === 0) {
    throw new GuardError("no_business_membership");
  }

  const cookieBusinessId = await readActiveBusinessCookie();
  const fromCookie = cookieBusinessId
    ? memberships.find((m) => m.businessId === cookieBusinessId)
    : undefined;
  const chosen = fromCookie ?? (memberships.length === 1 ? memberships[0] : undefined);

  if (!chosen) {
    throw new GuardError("no_business_membership", "ambiguous_active_business");
  }

  if (options.minimumRole && !hasMinimumRole(chosen.role, options.minimumRole)) {
    throw new GuardError("forbidden");
  }

  return { user, membership: chosen };
}
