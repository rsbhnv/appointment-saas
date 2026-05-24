import type { NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import type { TenantResolutionResult } from "@/types/tenant";

/**
 * Resolves tenant context from the incoming request.
 * Implementation is intentionally minimal — wire to your database later.
 *
 * Expected patterns:
 * - Subdomain: `{slug}.{rootDomain}`
 * - Path: `/t/{slug}/...` (future)
 */
export function resolveTenantFromRequest(request: NextRequest): TenantResolutionResult {
  const host = request.headers.get("host") ?? "";
  const rootDomain = siteConfig.rootDomain;

  if (host && host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
    const slug = host.slice(0, -(rootDomain.length + 1));
    if (slug && !slug.includes(".")) {
      return {
        tenant: {
          id: slug,
          slug,
          name: slug,
        },
        source: "subdomain",
      };
    }
  }

  return { tenant: null, source: "none" };
}
