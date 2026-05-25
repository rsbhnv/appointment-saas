import "server-only";

import { DEMO_BUSINESS } from "./fixtures";
import type { Tables, TablesUpdate } from "@/types/database";

/**
 * In-process business profile store for demo mode.
 * Resets on every Node process restart.
 */
type BusinessStore = {
  business: Tables<"businesses">;
};

const globalKey = Symbol.for("appointment-saas.demoBusinessStore");
type GlobalWithStore = typeof globalThis & { [globalKey]?: BusinessStore };

function getStore(): BusinessStore {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = { business: { ...DEMO_BUSINESS } };
  }
  return g[globalKey]!;
}

export function readDemoBusiness(): Tables<"businesses"> {
  return { ...getStore().business };
}

export function updateDemoBusiness(
  patch: TablesUpdate<"businesses">,
): Tables<"businesses"> {
  const store = getStore();
  store.business = {
    ...store.business,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return { ...store.business };
}

export function resetDemoBusinessStore(): void {
  const g = globalThis as GlobalWithStore;
  delete g[globalKey];
}
