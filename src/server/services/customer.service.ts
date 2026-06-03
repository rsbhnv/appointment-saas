import "server-only";

import { customerBookingPath } from "@/lib/tenant/customer-portal-paths";
import {
  findCustomerProfilesByEmail,
  type CustomerProfile,
} from "@/server/repositories/customers";

/** Primary customer portal path, or null when the user has no CRM profile. */
export async function resolvePrimaryCustomerPortalPath(
  email: string,
): Promise<string | null> {
  const profiles = await findCustomerProfilesByEmail(email);
  if (profiles.length === 0) return null;
  const sorted = [...profiles].sort((a, b) =>
    a.businessName.localeCompare(b.businessName, "he"),
  );
  return customerBookingPath(sorted[0]!.businessSlug);
}

export async function listCustomerProfilesForEmail(
  email: string,
): Promise<CustomerProfile[]> {
  const profiles = await findCustomerProfilesByEmail(email);
  return [...profiles].sort((a, b) =>
    a.businessName.localeCompare(b.businessName, "he"),
  );
}
