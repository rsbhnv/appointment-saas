/**
 * Multi-tenant domain types (no persistence layer yet).
 */
export type TenantId = string;

export type TenantSlug = string;

export interface TenantContext {
  id: TenantId;
  slug: TenantSlug;
  name: string;
}

export interface TenantResolutionResult {
  tenant: TenantContext | null;
  source: "subdomain" | "path" | "header" | "none";
}
