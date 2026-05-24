import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type DashboardNavItem } from "@/components/layout/dashboard-nav";
import { GuardError, requirePlatformAdmin } from "@/server/guards";

const SUPER_ADMIN_NAV: DashboardNavItem[] = [
  { href: "/super-admin", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/super-admin/businesses", label: "עסקים", disabled: true, icon: Building2 },
  { href: "/super-admin/users", label: "משתמשים", disabled: true, icon: Users },
  {
    href: "/super-admin/subscriptions",
    label: "מנויים",
    disabled: true,
    icon: CreditCard,
  },
  { href: "/super-admin/plans", label: "תוכניות", disabled: true, icon: FileText },
  {
    href: "/super-admin/audit-logs",
    label: "יומן ביקורת",
    disabled: true,
    icon: Shield,
  },
  {
    href: "/super-admin/system-settings",
    label: "הגדרות מערכת",
    disabled: true,
    icon: Settings,
  },
];

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requirePlatformAdmin();
  } catch (err) {
    if (err instanceof GuardError) {
      if (err.code === "unauthenticated") {
        redirect("/login?next=/super-admin");
      }
      if (err.code === "platform_admin_required") {
        redirect("/dashboard");
      }
    }
    throw err;
  }

  return (
    <DashboardShell
      variant="super-admin"
      title="סקירת פלטפורמה"
      email={user.email}
      navItems={SUPER_ADMIN_NAV}
      navAriaLabel="ניווט פלטפורמה"
      userSubtitle="Platform Control"
    >
      {children}
    </DashboardShell>
  );
}
