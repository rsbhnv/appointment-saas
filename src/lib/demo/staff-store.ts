import "server-only";

import { DEMO_STAFF_SEED } from "./fixtures";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type StaffStore = {
  rows: Tables<"staff_members">[];
};

const globalKey = Symbol.for("appointment-saas.demoStaffStore");
type GlobalWithStore = typeof globalThis & { [globalKey]?: StaffStore };

function getStore(): StaffStore {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = { rows: DEMO_STAFF_SEED.map((row) => ({ ...row })) };
  }
  return g[globalKey]!;
}

export const demoStaffStore = {
  list(businessId: string): Tables<"staff_members">[] {
    return getStore()
      .rows.filter((row) => row.business_id === businessId)
      .map((row) => ({ ...row }));
  },

  findById(id: string): Tables<"staff_members"> | null {
    const row = getStore().rows.find((item) => item.id === id);
    return row ? { ...row } : null;
  },

  create(input: TablesInsert<"staff_members">): Tables<"staff_members"> {
    const store = getStore();
    const now = new Date().toISOString();
    const row: Tables<"staff_members"> = {
      id: input.id ?? crypto.randomUUID(),
      business_id: input.business_id,
      user_id: input.user_id ?? null,
      name: input.name,
      title: input.title ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      color: input.color ?? null,
      active: input.active ?? true,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
    };
    store.rows.push(row);
    return { ...row };
  },

  update(id: string, patch: TablesUpdate<"staff_members">): Tables<"staff_members"> {
    const store = getStore();
    const index = store.rows.findIndex((row) => row.id === id);
    if (index === -1) throw new Error("staff member not found");
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
