import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { BusinessThemeScope } from "@/components/theme/business-theme-scope";
import { tenantService } from "@/server/services";

export default async function CustomerPortalLayout({
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
      <AppShell
        navItems={[]}
        secondaryAction={{ href: "/login", label: "התחברות" }}
      >
        {children}
      </AppShell>
    </BusinessThemeScope>
  );
}
