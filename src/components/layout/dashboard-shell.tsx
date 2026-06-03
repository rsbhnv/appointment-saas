import Link from "next/link";

import { DemoModeBadge } from "@/components/layout/demo-mode-badge";
import { DashboardNav, type DashboardNavItem } from "@/components/layout/dashboard-nav";
import { LogoMark } from "@/components/layout/logo-mark";
import { BusinessLogo } from "@/components/business/business-logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { signOut } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  title: string;
  email: string | null;
  navItems: DashboardNavItem[];
  navAriaLabel: string;
  children: React.ReactNode;
  variant?: "default" | "super-admin";
  userSubtitle?: string;
  businessName?: string | null;
  businessLogoUrl?: string | null;
};

export function DashboardShell({
  title,
  email,
  navItems,
  navAriaLabel,
  children,
  variant = "default",
  userSubtitle,
  businessName,
  businessLogoUrl,
}: DashboardShellProps) {
  const isSuperAdmin = variant === "super-admin";
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  return (
    <div
      className={cn("flex min-h-svh flex-col bg-surface", isSuperAdmin && "dark")}
      dir="rtl"
    >
      {/* Mobile top bar */}
      <header className="glass-header sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-outline-variant/30 bg-surface/80 px-margin-mobile md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-bold text-primary">
          {businessName ? (
            <>
              <BusinessLogo
                name={businessName}
                logoUrl={businessLogoUrl}
                size="sm"
                rounded="full"
              />
              <span className="truncate text-base">{businessName}</span>
            </>
          ) : (
            <>
              <LogoMark className="size-8 shrink-0" />
              <span className="text-lg">{siteConfig.name}</span>
            </>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <DemoModeBadge />
          <div className="flex size-9 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
            {initials}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — RTL: fixed on the right */}
        <aside
          className={cn(
            "fixed inset-y-0 end-0 z-50 hidden w-[280px] flex-col border-s border-outline-variant/20 bg-card p-6 text-start shadow-[0_8px_40px_rgba(28,32,24,0.08)] md:flex",
            isSuperAdmin && "bg-surface",
          )}
        >
          <div className="mb-8 px-1">
            <Link href="/" className="flex flex-row-reverse items-center gap-2">
              <LogoMark className="size-9" />
              <span className="text-xl font-bold text-primary">{siteConfig.name}</span>
            </Link>
            {isSuperAdmin ? (
              <p className="mt-1 text-xs uppercase tracking-widest text-outline">
                Platform Control
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "mb-6 flex flex-row-reverse items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low/80 p-3",
              isSuperAdmin && "border-outline-variant",
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-sm font-semibold text-on-surface">
                {email ?? "משתמש"}
              </p>
              {userSubtitle ? (
                <p className="truncate text-xs text-on-surface-variant">{userSubtitle}</p>
              ) : null}
              {isSuperAdmin ? (
                <p className="text-xs font-bold text-primary">Super Admin</p>
              ) : null}
            </div>
          </div>

          <DashboardNav
            items={navItems}
            ariaLabel={navAriaLabel}
            variant="sidebar"
            className="flex-1"
          />

          <div className="mt-auto space-y-3 border-t border-outline-variant/30 pt-4">
            <DemoModeBadge className="w-full justify-center" />
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full rounded-full">
                התנתקות
              </Button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col md:me-[280px]">
          <header className="glass-header sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-outline-variant/30 bg-background/80 px-margin-desktop md:flex">
            <div className="flex min-w-0 items-center gap-3">
              {businessName ? (
                <>
                  <BusinessLogo
                    name={businessName}
                    logoUrl={businessLogoUrl}
                    size="sm"
                    rounded="full"
                  />
                  <h2 className="truncate text-xl font-bold text-on-surface">{businessName}</h2>
                </>
              ) : (
                <h2 className="text-xl font-bold text-on-surface">{title}</h2>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  SUPER ADMIN
                </span>
              ) : null}
              {email ? (
                <span className="text-xs text-on-surface-variant">{email}</span>
              ) : null}
            </div>
          </header>

          <main className="flex-1 px-margin-mobile py-6 pb-nav-safe md:px-margin-desktop md:py-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/20 bg-card/95 pb-safe backdrop-blur-md md:hidden">
        <DashboardNav
          items={navItems.filter((item) => !item.disabled)}
          ariaLabel={navAriaLabel}
          variant="horizontal"
          className="px-1 py-1"
        />
      </div>
    </div>
  );
}
