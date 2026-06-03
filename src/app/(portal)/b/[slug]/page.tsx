import { redirect } from "next/navigation";

import { customerBookingPath } from "@/lib/tenant/customer-portal-paths";

export default async function LegacyCustomerPortalRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(customerBookingPath(slug));
}
