"use client";

import { useEffect } from "react";

function syncSystemTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", prefersDark);
  document.documentElement.classList.toggle("light", !prefersDark);
}

export function SystemThemeSync() {
  useEffect(() => {
    syncSystemTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  return null;
}
