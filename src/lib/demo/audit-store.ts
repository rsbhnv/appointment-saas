import "server-only";

import { DEMO_AUDIT_SEED, type DemoAuditEvent } from "./fixtures";

/**
 * In-process audit store for demo mode.
 *
 * Resets on every Node process restart. This is intentional — demo data
 * should never persist across runs and never leaks into production stores.
 */
type AuditStore = {
  events: DemoAuditEvent[];
  initialized: boolean;
};

const globalKey = Symbol.for("appointment-saas.demoAuditStore");
type GlobalWithStore = typeof globalThis & { [globalKey]?: AuditStore };

function getStore(): AuditStore {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = { events: [...DEMO_AUDIT_SEED], initialized: true };
  }
  return g[globalKey]!;
}

export function appendDemoAuditEvent(
  event: Omit<DemoAuditEvent, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
  },
): DemoAuditEvent {
  const store = getStore();
  const row: DemoAuditEvent = {
    id: event.id ?? crypto.randomUUID(),
    business_id: event.business_id ?? null,
    user_id: event.user_id ?? null,
    action: event.action,
    entity_type: event.entity_type ?? null,
    entity_id: event.entity_id ?? null,
    metadata: event.metadata ?? {},
    created_at: event.created_at ?? new Date().toISOString(),
  };
  store.events.push(row);
  return row;
}

export function listDemoAuditEvents(filter?: {
  businessId?: string | null;
}): DemoAuditEvent[] {
  const store = getStore();
  const rows = [...store.events].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  if (!filter?.businessId) return rows;
  return rows.filter((r) => r.business_id === filter.businessId);
}

export function resetDemoAuditStore(): void {
  const g = globalThis as GlobalWithStore;
  delete g[globalKey];
}
