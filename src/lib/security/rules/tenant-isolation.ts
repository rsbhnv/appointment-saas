/**
 * Tenant isolation rules — enforce at DB (RLS), API, and cache layers.
 */
export const tenantIsolationRules = {
  /** One tenant's data must never leak to another tenant's context. */
  strictIsolation: true,

  /** Prefer Supabase RLS policies keyed on tenant_id / auth.uid(). */
  preferDatabaseRls: true,

  /** Tenant slug in URL/subdomain must match session tenant (when authenticated). */
  validateTenantBinding: true,

  /** Cross-tenant admin requires explicit platform role, not tenant role. */
  platformAdminSeparate: true,
} as const;
