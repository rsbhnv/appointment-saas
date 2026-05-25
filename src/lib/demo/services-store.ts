import "server-only";

import { DEMO_SERVICE_SEED } from "./fixtures";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type ServicesStore = {
  rows: Tables<"services">[];
};

const globalKey = Symbol.for("appointment-saas.demoServicesStore");
type GlobalWithStore = typeof globalThis & { [globalKey]?: ServicesStore };

function getStore(): ServicesStore {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = { rows: DEMO_SERVICE_SEED.map((row) => ({ ...row })) };
  }
  return g[globalKey]!;
}

export const demoServicesStore = {
  list(businessId: string): Tables<"services">[] {
    return getStore()
      .rows.filter((row) => row.business_id === businessId)
      .map((row) => ({ ...row }));
  },

  findById(id: string): Tables<"services"> | null {
    const row = getStore().rows.find((item) => item.id === id);
    return row ? { ...row } : null;
  },

  create(input: TablesInsert<"services">): Tables<"services"> {
    const store = getStore();
    const now = new Date().toISOString();
    const row: Tables<"services"> = {
      id: input.id ?? crypto.randomUUID(),
      business_id: input.business_id,
      name: input.name,
      description: input.description ?? null,
      duration_minutes: input.duration_minutes,
      price: input.price,
      currency: input.currency ?? "ILS",
      buffer_before_minutes: input.buffer_before_minutes ?? 0,
      buffer_after_minutes: input.buffer_after_minutes ?? 0,
      capacity: input.capacity ?? 1,
      requires_payment: input.requires_payment ?? false,
      deposit_amount: input.deposit_amount ?? null,
      active: input.active ?? true,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
    };
    store.rows.push(row);
    return { ...row };
  },

  update(id: string, patch: TablesUpdate<"services">): Tables<"services"> {
    const store = getStore();
    const index = store.rows.findIndex((row) => row.id === id);
    if (index === -1) throw new Error("service not found");
    store.rows[index] = {
      ...store.rows[index]!,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    return { ...store.rows[index]! };
  },

  reset(): void {
    const g = globalThis as GlobalWithStore;
    delete g[globalKey];
  },
};
