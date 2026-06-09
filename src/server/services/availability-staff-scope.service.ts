import "server-only";

import { listStaffByBusinessId } from "@/server/repositories/staff-members";

export async function soleActiveStaffMemberId(
  businessId: string,
): Promise<string | null> {
  const staff = await listStaffByBusinessId(businessId);
  const active = staff.filter((member) => member.active);
  return active.length === 1 ? active[0]!.id : null;
}

export async function resolveAvailabilityStaffMemberId(
  businessId: string,
  staffMemberId: string | null | undefined,
): Promise<string | null> {
  const soleStaffId = await soleActiveStaffMemberId(businessId);
  if (soleStaffId) return soleStaffId;
  return staffMemberId ?? null;
}
