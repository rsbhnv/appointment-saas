import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
      <div className="pointer-events-none fixed top-1/2 -end-24 -z-10 size-64 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 -start-24 -z-10 size-80 rounded-full bg-primary-container/5 blur-3xl" />

      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          {siteConfig.name}
        </h1>
      </div>

      {children}

      <p className="mt-10 text-center text-xs text-on-surface-variant/70 pb-safe">
        © {new Date().getFullYear()} {siteConfig.name}. כל הזכויות שמורות.
      </p>
    </div>
  );
}
