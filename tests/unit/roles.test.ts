import { describe, expect, it } from "vitest";

import { hasMinimumRole, isAdminRole, isOwnerRole } from "@/lib/auth/roles";

describe("roles", () => {
  it("hasMinimumRole compares by rank", () => {
    expect(hasMinimumRole("business_owner", "staff")).toBe(true);
    expect(hasMinimumRole("business_admin", "staff")).toBe(true);
    expect(hasMinimumRole("staff", "business_admin")).toBe(false);
    expect(hasMinimumRole("business_admin", "business_owner")).toBe(false);
    expect(hasMinimumRole("business_owner", "business_owner")).toBe(true);
  });

  it("isAdminRole / isOwnerRole identify privileged roles", () => {
    expect(isAdminRole("business_owner")).toBe(true);
    expect(isAdminRole("business_admin")).toBe(true);
    expect(isAdminRole("staff")).toBe(false);
    expect(isOwnerRole("business_owner")).toBe(true);
    expect(isOwnerRole("business_admin")).toBe(false);
  });
});
