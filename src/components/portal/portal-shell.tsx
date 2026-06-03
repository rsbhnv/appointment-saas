import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PortalShellProps = {
  children: ReactNode;
  className?: string;
};

/** Mobile-first customer portal chrome (cream background, no marketing header). */
export function PortalShell({ children, className }: PortalShellProps) {
  return (
    <div
      data-portal-shell
      className={cn(
        "min-h-dvh bg-surface text-on-surface antialiased",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-md px-margin-mobile pb-safe pt-6 sm:max-w-lg sm:px-6 sm:pt-8">
        {children}
      </div>
    </div>
  );
}
