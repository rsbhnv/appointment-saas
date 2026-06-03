import "server-only";

import { readDemoBusiness, updateDemoBusiness } from "@/lib/demo/business-store";
import {
  clearDemoBusinessLogo,
  demoBusinessLogoApiPath,
  migrateDemoLogoDataUrl,
  setDemoBusinessLogo,
} from "@/lib/demo/logo-store";
import { isDemoMode } from "@/lib/env/client";
import { clientEnv } from "@/lib/env/client";
import {
  BUSINESS_LOGO_BUCKET,
  BUSINESS_LOGO_EXTENSIONS,
  BUSINESS_LOGO_MAX_BYTES,
  businessLogoStoragePath,
  extensionForLogoMime,
  isAllowedLogoMime,
  type BusinessLogoMimeType,
} from "@/lib/business/logo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateBusiness } from "@/server/repositories/businesses";

export type LogoUploadResult =
  | { ok: true; logoUrl: string }
  | { ok: false; error: "invalid_input" | "file_too_large" | "upload_failed" | "unknown" };

function publicLogoUrl(path: string): string {
  const base = clientEnv.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Supabase URL not configured");
  return `${base}/storage/v1/object/public/${BUSINESS_LOGO_BUCKET}/${path}`;
}

async function removeLogoObjects(businessId: string, keepExt?: string): Promise<void> {
  const paths = BUSINESS_LOGO_EXTENSIONS.filter((ext) => ext !== keepExt).map((ext) =>
    businessLogoStoragePath(businessId, ext),
  );
  if (paths.length === 0) return;

  if (isDemoMode) return;

  const admin = createSupabaseAdminClient();
  await admin.storage.from(BUSINESS_LOGO_BUCKET).remove(paths);
}

export async function uploadBusinessLogo(
  businessId: string,
  file: File,
): Promise<LogoUploadResult> {
  if (!isAllowedLogoMime(file.type)) {
    return { ok: false, error: "invalid_input" };
  }
  if (file.size <= 0 || file.size > BUSINESS_LOGO_MAX_BYTES) {
    return { ok: false, error: "file_too_large" };
  }

  const ext = extensionForLogoMime(file.type);
  if (!ext) return { ok: false, error: "invalid_input" };

  if (isDemoMode) {
    const current = readDemoBusiness();
    if (current.id !== businessId) {
      return { ok: false, error: "unknown" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    setDemoBusinessLogo(businessId, file.type as BusinessLogoMimeType, buffer);
    const logoUrl = demoBusinessLogoApiPath(businessId);
    const updated = updateDemoBusiness({ logo_url: logoUrl });
    return { ok: true, logoUrl: updated.logo_url! };
  }

  const path = businessLogoStoragePath(businessId, ext);
  const supabase = await createSupabaseServerClient();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUSINESS_LOGO_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: "upload_failed" };
  }

  await removeLogoObjects(businessId, ext);

  const logoUrl = publicLogoUrl(path);
  await updateBusiness(businessId, { logo_url: logoUrl });

  return { ok: true, logoUrl };
}

export async function removeBusinessLogo(
  businessId: string,
): Promise<{ ok: true } | { ok: false; error: "unknown" }> {
  if (isDemoMode) {
    const current = readDemoBusiness();
    if (current.id !== businessId) {
      return { ok: false, error: "unknown" };
    }
    updateDemoBusiness({ logo_url: null });
    clearDemoBusinessLogo(businessId);
    return { ok: true };
  }

  await removeLogoObjects(businessId);

  const admin = createSupabaseAdminClient();
  const paths = BUSINESS_LOGO_EXTENSIONS.map((ext) => businessLogoStoragePath(businessId, ext));
  await admin.storage.from(BUSINESS_LOGO_BUCKET).remove(paths);

  await updateBusiness(businessId, { logo_url: null });
  return { ok: true };
}
