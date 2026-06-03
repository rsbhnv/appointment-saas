"use client";

import type { ReactNode } from "react";

import { SystemThemeSync } from "@/components/providers/system-theme-sync";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <SystemThemeSync />
      {children}
    </>
  );
}
