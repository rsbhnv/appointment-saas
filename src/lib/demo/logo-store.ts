import "server-only";

import type { BusinessLogoMimeType } from "@/lib/business/logo";
import { isAllowedLogoMime } from "@/lib/business/logo";

type DemoLogoEntry = {
  mime: BusinessLogoMimeType;
  buffer: Buffer;
};

const globalKey = Symbol.for("appointment-saas.demoLogoStore");
type GlobalWithStore = typeof globalThis & {
  [globalKey]?: Map<string, DemoLogoEntry>;
};

function getStore(): Map<string, DemoLogoEntry> {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey]!;
}

export function demoBusinessLogoApiPath(businessId: string): string {
  return `/api/demo/business-logo/${businessId}`;
}

export function setDemoBusinessLogo(
  businessId: string,
  mime: BusinessLogoMimeType,
  buffer: Buffer,
): void {
  getStore().set(businessId, { mime, buffer });
}

export function readDemoBusinessLogo(businessId: string): DemoLogoEntry | null {
  return getStore().get(businessId) ?? null;
}

export function clearDemoBusinessLogo(businessId: string): void {
  getStore().delete(businessId);
}

/** Move legacy inline data URLs into the logo store so RSC payloads stay small. */
export function migrateDemoLogoDataUrl(
  businessId: string,
  logoUrl: string | null,
): string | null {
  if (!logoUrl?.startsWith("data:")) return logoUrl;

  const match = /^data:([^;]+);base64,(.+)$/.exec(logoUrl);
  if (!match) return null;

  const mime = match[1]!;
  if (!isAllowedLogoMime(mime)) return null;

  const buffer = Buffer.from(match[2]!, "base64");
  setDemoBusinessLogo(businessId, mime, buffer);
  return demoBusinessLogoApiPath(businessId);
}
