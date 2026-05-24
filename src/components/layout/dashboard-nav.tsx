"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  LayoutDashboard,
  Package,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  disabled?: boolean;
  icon?: LucideIcon;
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
      <nav className={cn("flex flex-wrap gap-1", className)} aria-label={ariaLabel}>
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
  const Icon = item.icon ?? DEFAULT_ICONS[item.href] ?? LayoutDashboard;

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
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        variant === "sidebar" && "flex-row-reverse",
        active
          ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-high",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0" />
      {item.label}
    </Link>
  );
}
