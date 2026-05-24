import { describe, expect, it } from "vitest";

import {
  DEMO_AUDIT_SEED,
  DEMO_BUSINESS,
  DEMO_BUSINESS_ID,
  DEMO_MEMBERSHIPS,
  DEMO_USERS,
  DEMO_USER_IDS,
  DEMO_USER_KEYS,
  isDemoUserKey,
} from "@/lib/demo/fixtures";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("demo fixtures", () => {
  it("exposes the three documented demo roles", () => {
    expect(DEMO_USER_KEYS).toEqual(["super_admin", "business_owner", "staff"]);
  });

  it("every demo user has a unique UUID id and matching record", () => {
    const ids = new Set<string>();
    for (const key of DEMO_USER_KEYS) {
      const user = DEMO_USERS[key];
      expect(user.id).toMatch(UUID);
      expect(user.id).toBe(DEMO_USER_IDS[key]);
      expect(ids.has(user.id)).toBe(false);
      ids.add(user.id);
    }
  });

  it("only the super_admin demo user carries the platform role", () => {
    expect(DEMO_USERS.super_admin.platformRole).toBe("super_admin");
    expect(DEMO_USERS.business_owner.platformRole).toBeNull();
    expect(DEMO_USERS.staff.platformRole).toBeNull();
  });

  it("DEMO_BUSINESS uses a UUID id matching DEMO_BUSINESS_ID", () => {
    expect(DEMO_BUSINESS.id).toMatch(UUID);
    expect(DEMO_BUSINESS.id).toBe(DEMO_BUSINESS_ID);
    expect(DEMO_BUSINESS.status).toBe("active");
  });

  it("every membership references known users and the demo business", () => {
    const knownUserIds = new Set(Object.values(DEMO_USER_IDS));
    for (const m of DEMO_MEMBERSHIPS) {
      expect(knownUserIds.has(m.userId)).toBe(true);
      expect(m.businessId).toBe(DEMO_BUSINESS_ID);
    }
  });

  it("super_admin is intentionally NOT a business member", () => {
    const superId = DEMO_USER_IDS.super_admin;
    expect(DEMO_MEMBERSHIPS.some((m) => m.userId === superId)).toBe(false);
  });

  it("audit seed references known user/business ids", () => {
    const knownUserIds = new Set(Object.values(DEMO_USER_IDS));
    for (const event of DEMO_AUDIT_SEED) {
      if (event.user_id) expect(knownUserIds.has(event.user_id)).toBe(true);
      if (event.business_id) expect(event.business_id).toBe(DEMO_BUSINESS_ID);
      expect(event.action.length).toBeGreaterThan(0);
    }
  });

  it("isDemoUserKey accepts known keys and rejects others", () => {
    expect(isDemoUserKey("super_admin")).toBe(true);
    expect(isDemoUserKey("business_owner")).toBe(true);
    expect(isDemoUserKey("staff")).toBe(true);
    expect(isDemoUserKey("attacker")).toBe(false);
    expect(isDemoUserKey(undefined)).toBe(false);
    expect(isDemoUserKey(42)).toBe(false);
  });
});
