import type { MemberRole } from "@/types/database";

export const PLATFORM_ROLE_SUPER_ADMIN = "super_admin" as const;
export type PlatformRole = typeof PLATFORM_ROLE_SUPER_ADMIN;

export const MEMBER_ROLES: readonly MemberRole[] = [
  "business_owner",
  "business_admin",
  "staff",
] as const;

const ROLE_RANK: Record<MemberRole, number> = {
  business_owner: 3,
  business_admin: 2,
  staff: 1,
};

export function hasMinimumRole(actual: MemberRole, minimum: MemberRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}

export function isAdminRole(role: MemberRole): boolean {
  return role === "business_owner" || role === "business_admin";
}

export function isOwnerRole(role: MemberRole): boolean {
  return role === "business_owner";
}
