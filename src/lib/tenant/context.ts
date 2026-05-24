import "server-only";

import type { TenantContext } from "@/types/tenant";

/**
 * Placeholder for request-scoped tenant context.
 * Replace with AsyncLocalStorage or cached lookup when DB is added.
 */
export type TenantScope = {
  tenant: TenantContext | null;
};

export function createTenantScope(tenant: TenantContext | null): TenantScope {
  return { tenant };
}
