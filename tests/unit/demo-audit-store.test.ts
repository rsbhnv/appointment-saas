import { beforeEach, describe, expect, it } from "vitest";

import {
  appendDemoAuditEvent,
  listDemoAuditEvents,
  resetDemoAuditStore,
} from "@/lib/demo/audit-store";
import { DEMO_AUDIT_SEED, DEMO_BUSINESS_ID } from "@/lib/demo/fixtures";

describe("demo audit store", () => {
  beforeEach(() => {
    resetDemoAuditStore();
  });

  it("starts seeded with DEMO_AUDIT_SEED", () => {
    const rows = listDemoAuditEvents();
    expect(rows.length).toBe(DEMO_AUDIT_SEED.length);
  });

  it("appendDemoAuditEvent prepends new events to the listing (desc by created_at)", () => {
    const event = appendDemoAuditEvent({
      action: "demo.test_event",
      business_id: DEMO_BUSINESS_ID,
      user_id: null,
      entity_type: null,
      entity_id: null,
      metadata: { foo: "bar" },
    });
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    const rows = listDemoAuditEvents();
    expect(rows[0]?.action).toBe("demo.test_event");
    expect(rows[0]?.metadata).toEqual({ foo: "bar" });
  });

  it("filters by businessId when requested", () => {
    appendDemoAuditEvent({
      action: "scoped.event",
      business_id: DEMO_BUSINESS_ID,
      user_id: null,
      entity_type: null,
      entity_id: null,
      metadata: {},
    });
    appendDemoAuditEvent({
      action: "global.event",
      business_id: null,
      user_id: null,
      entity_type: null,
      entity_id: null,
      metadata: {},
    });
    const scoped = listDemoAuditEvents({ businessId: DEMO_BUSINESS_ID });
    expect(scoped.every((r) => r.business_id === DEMO_BUSINESS_ID)).toBe(true);
    expect(scoped.some((r) => r.action === "scoped.event")).toBe(true);
    expect(scoped.some((r) => r.action === "global.event")).toBe(false);
  });
});
