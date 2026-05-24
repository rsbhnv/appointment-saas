import { redirect } from "next/navigation";

import {
  DashboardShell,
} from "@/components/layout/dashboard-shell";
import { type DashboardNavItem } from "@/components/layout/dashboard-nav";
import { siteConfig } from "@/config/site";
import { GuardError, requireSession } from "@/server/guards";

const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "סקירה" },
  { href: "/dashboard/calendar", label: "יומן" },
  { href: "/dashboard/availability", label: "זמינות" },
  { href: "/dashboard/customers", label: "לקוחות" },
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

  return (
    <DashboardShell
      title={`${siteConfig.name} · לוח בקרה`}
      email={user.email}
      navItems={DASHBOARD_NAV}
      navAriaLabel="ניווט לוח בקרה"
    >
      {children}
    </DashboardShell>
  );
}
