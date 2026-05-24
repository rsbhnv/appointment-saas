import "server-only";

import { DEMO_MEMBERSHIPS } from "@/lib/demo/fixtures";
import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessMembership } from "@/server/guards/business-member";

/**
 * Active memberships for the signed-in user.
 *
 * - Production: RLS-scoped query against `business_members`.
 * - Demo: returns matching seed memberships from `DEMO_MEMBERSHIPS`.
 */
export async function findActiveMembershipsForUser(
  userId: string,
): Promise<BusinessMembership[]> {
  if (isDemoMode) {
    return DEMO_MEMBERSHIPS.filter((m) => m.userId === userId).map((m) => ({
      businessId: m.businessId,
      role: m.role,
      permissions: {},
    }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_members")
    .select("business_id, role, permissions, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(`business_members lookup failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    businessId: row.business_id,
    role: row.role,
    permissions:
      (row.permissions as Record<string, unknown> | null) ??
      ({} as Record<string, unknown>),
  }));
}
