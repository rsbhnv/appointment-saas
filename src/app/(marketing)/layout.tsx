import { AppShell } from "@/components/layout/app-shell";
import { isDemoMode } from "@/lib/env/client";

const BASE_NAV_ITEMS = [
  { href: "/#features", label: "תכונות" },
  { href: "/#flow", label: "איך זה עובד" },
];

const DEMO_NAV_ITEMS = [{ href: "/preview", label: "כל המסכים" }];

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = isDemoMode
    ? [...BASE_NAV_ITEMS, ...DEMO_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <AppShell
      navItems={navItems}
      secondaryAction={{ href: "/login", label: "התחברות" }}
    >
      {children}
    </AppShell>
  );
}
