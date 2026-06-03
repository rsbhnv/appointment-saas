import { redirect } from "next/navigation";

import {
  DashboardShell,
} from "@/components/layout/dashboard-shell";
import { type DashboardNavItem } from "@/components/layout/dashboard-nav";
import { BusinessThemeScope } from "@/components/theme/business-theme-scope";
import { siteConfig } from "@/config/site";
import { GuardError, requireSession } from "@/server/guards";
import { findActiveMembershipsForUser } from "@/server/repositories/business-members";
import { findBusinessById } from "@/server/repositories/businesses";

const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "סקירה" },
  { href: "/dashboard/calendar", label: "יומן" },
  { href: "/dashboard/availability", label: "זמינות" },
  { href: "/dashboard/customers", label: "לקוחות", disabled: true },
  { href: "/dashboard/services", label: "שירותים" },
  { href: "/dashboard/staff", label: "צוות" },
  { href: "/dashboard/settings", label: "הגדרות" },
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireSession();
  } catch (err) {
    if (err instanceof GuardError && err.code === "unauthenticated") {
      redirect("/login?next=/dashboard");
    }
    throw err;
  }

  let business = null;

  if (user.platformRole !== "super_admin") {
    const memberships = await findActiveMembershipsForUser(user.id);
    if (memberships.length === 0) {
      redirect("/dashboard?empty=1");
    }
    business = await findBusinessById(memberships[0]!.businessId);
  }

  return (
    <BusinessThemeScope business={business}>
      <DashboardShell
        title={`${siteConfig.name} · לוח בקרה`}
        email={user.email}
        navItems={DASHBOARD_NAV}
        navAriaLabel="ניווט לוח בקרה"
        businessName={business?.name}
        businessLogoUrl={business?.logo_url}
      >
        {children}
      </DashboardShell>
    </BusinessThemeScope>
  );
}
