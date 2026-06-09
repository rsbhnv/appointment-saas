type StaffLike = { id: string; active: boolean };

export function activeStaffMembers<T extends StaffLike>(staff: T[]): T[] {
  return staff.filter((member) => member.active);
}

export function soleActiveStaffMemberId(staff: StaffLike[]): string | null {
  const active = activeStaffMembers(staff);
  return active.length === 1 ? active[0]!.id : null;
}

export function showAvailabilityStaffSelector(staff: StaffLike[]): boolean {
  return activeStaffMembers(staff).length > 1;
}

/** Maps UI selection to persisted staff scope — never null for single-staff businesses. */
export function resolveAvailabilityStaffScope(
  staffMemberId: string,
  soleStaffId: string | null,
): string | null {
  if (soleStaffId) return soleStaffId;
  return staffMemberId || null;
}
