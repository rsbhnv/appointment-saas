"use client";

import { useEffect } from "react";

/**
 * Registers the service worker when PWA is enabled in production.
 * Disabled by default until icons and caching strategy are defined.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator) ||
      process.env.NEXT_PUBLIC_ENABLE_PWA !== "true"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
