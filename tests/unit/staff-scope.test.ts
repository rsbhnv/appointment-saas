import { describe, expect, it } from "vitest";

import {
  resolveAvailabilityStaffScope,
  showAvailabilityStaffSelector,
  soleActiveStaffMemberId,
} from "@/lib/availability/staff-scope";

const staff = [
  { id: "a", active: true },
  { id: "b", active: false },
];

describe("staff-scope", () => {
  it("returns sole active staff id", () => {
    expect(soleActiveStaffMemberId(staff)).toBe("a");
  });

  it("hides selector for single active staff", () => {
    expect(showAvailabilityStaffSelector(staff)).toBe(false);
  });

  it("shows selector for multiple active staff", () => {
    expect(
      showAvailabilityStaffSelector([
        { id: "a", active: true },
        { id: "b", active: true },
      ]),
    ).toBe(true);
  });

  it("forces staff scope for single-staff businesses", () => {
    expect(resolveAvailabilityStaffScope("", "a")).toBe("a");
    expect(resolveAvailabilityStaffScope("ignored", "a")).toBe("a");
  });

  it("preserves all-staff scope for multi-staff businesses", () => {
    expect(resolveAvailabilityStaffScope("", null)).toBeNull();
    expect(resolveAvailabilityStaffScope("b", null)).toBe("b");
  });
});
