import type { CSSProperties, ReactNode } from "react";

import { resolveBusinessTheme } from "@/lib/theme/resolve-theme";
import type { BusinessThemeInput } from "@/lib/theme/types";
import { cn } from "@/lib/utils";

type BusinessThemeScopeProps = {
  business: BusinessThemeInput | null | undefined;
  children: ReactNode;
  className?: string;
};

export function BusinessThemeScope({
  business,
  children,
  className,
}: BusinessThemeScopeProps) {
  const theme = resolveBusinessTheme(business);

  if (!theme) {
    return <>{children}</>;
  }

  return (
    <div
      data-tenant-theme={theme.style ?? "custom"}
      className={cn("tenant-themed min-h-full", className)}
      style={theme.cssVars as CSSProperties}
    >
      {children}
    </div>
  );
}
