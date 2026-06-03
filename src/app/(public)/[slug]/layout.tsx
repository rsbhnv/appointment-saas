import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import { BusinessThemeScope } from "@/components/theme/business-theme-scope";
import { tenantService } from "@/server/services";

export default async function PublicBusinessSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await tenantService.getPublicBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <BusinessThemeScope business={business}>
      <PortalShell>{children}</PortalShell>
    </BusinessThemeScope>
  );
}
