import "server-only";

import { requireBusinessMember } from "@/server/guards";
import { businessRepository } from "@/server/repositories";

/** Resolves the active tenant business for the signed-in member. */
export async function getActiveTenantBusiness() {
  const { membership } = await requireBusinessMember();
  const business = await businessRepository.findBusinessById(membership.businessId);
  if (!business) throw new Error("business not found");
  return { business, membership };
}

/** Public tenant lookup by slug (anon-safe via business_public view). */
export async function getPublicBusinessBySlug(slug: string) {
  return businessRepository.findBusinessBySlug(slug);
}
