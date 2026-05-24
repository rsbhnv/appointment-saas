import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/audit", () => ({
  recordAuditEvent: vi.fn(async () => {}),
}));

import { recordAuditEvent } from "@/server/services/audit";
import { withAudit } from "@/server/services/with-audit";

const recordAuditEventMock = vi.mocked(recordAuditEvent);

describe("withAudit", () => {
  beforeEach(() => {
    recordAuditEventMock.mockClear();
  });
  afterEach(() => {
    recordAuditEventMock.mockReset();
    recordAuditEventMock.mockImplementation(async () => {});
  });

  it("returns the action result unchanged", async () => {
    const wrapped = withAudit("test.event", async (n: number) => n * 2);
    await expect(wrapped(21)).resolves.toBe(42);
  });

  it("records the audit event after success (string descriptor)", async () => {
    const wrapped = withAudit("test.event", async (n: number) => n * 2);
    await wrapped(7);
    await new Promise((r) => setImmediate(r));
    expect(recordAuditEventMock).toHaveBeenCalledTimes(1);
    expect(recordAuditEventMock).toHaveBeenCalledWith({ action: "test.event" });
  });

  it("supports a descriptor function", async () => {
    const wrapped = withAudit(
      ([id]: [string], result: { ok: boolean }) => ({
        action: "test.dynamic",
        entityType: "thing",
        entityId: id,
        metadata: { ok: result.ok },
      }),
      async (id: string) => ({ ok: id.length > 0 }),
    );
    await wrapped("abc");
    await new Promise((r) => setImmediate(r));
    expect(recordAuditEventMock).toHaveBeenCalledWith({
      action: "test.dynamic",
      entityType: "thing",
      entityId: "abc",
      metadata: { ok: true },
    });
  });

  it("does not record audit events on action failure", async () => {
    const wrapped = withAudit("test.fail", async () => {
      throw new Error("boom");
    });
    await expect(wrapped()).rejects.toThrow("boom");
    await new Promise((r) => setImmediate(r));
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it("does not surface audit logging failures to the caller", async () => {
    recordAuditEventMock.mockImplementationOnce(async () => {
      throw new Error("audit-broken");
    });
    const wrapped = withAudit("test.event", async () => "ok");
    await expect(wrapped()).resolves.toBe("ok");
  });
});
