import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader, type SiteNavLink } from "@/components/layout/site-header";

type AppShellProps = {
  children: ReactNode;
  navItems?: SiteNavLink[];
  secondaryAction?: { href: string; label: string };
};

export function AppShell({ children, navItems, secondaryAction }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader navItems={navItems} secondaryAction={secondaryAction} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
