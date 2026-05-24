/**
 * Authorization security rules for multi-tenant SaaS.
 */
export const authorizationRules = {
  /** Default deny — explicit grants required per action. */
  defaultDeny: true,

  /** Every data query must be scoped by tenant_id when multi-tenant is enabled. */
  requireTenantScope: true,

  /** Role checks happen server-side after session validation. */
  serverSideRoleChecks: true,

  /** Admin/service operations use a separate code path with audit logging (future). */
  elevatedOperationsIsolated: true,
} as const;
