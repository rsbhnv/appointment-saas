export const BUSINESS_LOGO_BUCKET = "business-logos";

/** 2 MB — reasonable for web logos */
export const BUSINESS_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const BUSINESS_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type BusinessLogoMimeType = (typeof BUSINESS_LOGO_MIME_TYPES)[number];

const MIME_TO_EXT: Record<BusinessLogoMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function extensionForLogoMime(mime: string): string | null {
  if (!(BUSINESS_LOGO_MIME_TYPES as readonly string[]).includes(mime)) {
    return null;
  }
  return MIME_TO_EXT[mime as BusinessLogoMimeType];
}

export function isAllowedLogoMime(mime: string): mime is BusinessLogoMimeType {
  return (BUSINESS_LOGO_MIME_TYPES as readonly string[]).includes(mime);
}

export function getBusinessInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0);
}

export function businessLogoStoragePath(businessId: string, ext: string): string {
  return `${businessId}/logo.${ext}`;
}

export const BUSINESS_LOGO_EXTENSIONS = ["png", "jpg", "webp"] as const;
