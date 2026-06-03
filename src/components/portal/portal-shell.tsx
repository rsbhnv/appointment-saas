import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PortalShellProps = {
  children: ReactNode;
  className?: string;
};

/** Mobile-first customer portal chrome (warm wellness gradient). */
export function PortalShell({ children, className }: PortalShellProps) {
  return (
    <div
      data-portal-shell
      className={cn(
        "relative min-h-dvh overflow-x-clip bg-gradient-to-b from-[#f8f6f1] via-surface to-[#ebe8e0] text-on-surface antialiased",
        className,
      )}
    >
      {/* Soft decorative shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -start-16 top-24 size-56 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-12 top-[40%] size-48 rounded-full bg-secondary/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-32 start-1/4 size-40 rounded-full bg-primary/[0.04] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-md px-margin-mobile pb-safe pt-8 sm:max-w-lg sm:px-6 sm:pt-10">
        {children}
      </div>
    </div>
  );
}
