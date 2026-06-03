"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

const DEFAULT_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/calendar": Calendar,
  "/dashboard/availability": Clock,
  "/dashboard/customers": Users,
  "/dashboard/services": Package,
  "/dashboard/staff": UserCog,
  "/dashboard/settings": Settings,
  "/super-admin": LayoutDashboard,
  "/super-admin/businesses": Building2,
  "/super-admin/users": Users,
  "/super-admin/subscriptions": CreditCard,
  "/super-admin/plans": FileText,
  "/super-admin/audit-logs": Shield,
  "/super-admin/system-settings": Settings,
};

type DashboardNavProps = {
  items: DashboardNavItem[];
  ariaLabel: string;
  variant?: "horizontal" | "sidebar";
  className?: string;
};

export function DashboardNav({
  items,
  ariaLabel,
  variant = "sidebar",
  className,
}: DashboardNavProps) {
  const pathname = usePathname();

  if (variant === "horizontal") {
    return (
      <nav
        className={cn(
          "flex gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none",
          className,
        )}
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/super-admin" &&
              pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              item={item}
              active={active}
              variant="horizontal"
            />
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/super-admin" &&
            pathname.startsWith(item.href));
        return (
          <NavLink key={item.href} item={item} active={active} variant="sidebar" />
        );
      })}
    </nav>
  );
}

function NavLink({
  item,
  active,
  variant,
}: {
  item: DashboardNavItem;
  active: boolean;
  variant: "horizontal" | "sidebar";
}) {
  const Icon = DEFAULT_ICONS[item.href] ?? LayoutDashboard;

  if (item.disabled) {
    return (
      <span
        className={cn(
          "flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-outline/60",
          variant === "sidebar" && "flex-row-reverse",
        )}
        aria-disabled="true"
      >
        <Icon className="size-5 shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
        variant === "horizontal" &&
          "min-h-11 min-w-[4.25rem] shrink-0 flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] leading-tight",
        variant === "sidebar" && "flex-row-reverse",
        active
          ? "bg-primary font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(28,32,24,0.12)]"
          : "text-on-surface-variant hover:bg-surface-container-high",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("shrink-0", variant === "horizontal" ? "size-5" : "size-5")} />
      <span className={cn(variant === "horizontal" && "max-w-[4.5rem] truncate text-center")}>
        {item.label}
      </span>
    </Link>
  );
}
