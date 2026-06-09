import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

export type AppSettings = Tables<"app_settings">;

export async function findSettingsByBusinessId(
  businessId: string,
): Promise<AppSettings | null> {
  if (isDemoMode) {
    const { demoSettingsStore } = await import("@/lib/demo/settings-store");
    return demoSettingsStore.findByBusinessId(businessId);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw new Error(`app_settings lookup failed: ${error.message}`);
  return data ?? null;
}

export async function upsertSettings(
  businessId: string,
  patch: Omit<TablesUpdate<"app_settings">, "business_id">,
): Promise<AppSettings> {
  if (isDemoMode) {
    const { demoSettingsStore } = await import("@/lib/demo/settings-store");
    return demoSettingsStore.upsert(businessId, patch);
  }
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("app_settings")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`app_settings lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("app_settings")
      .update(patch)
      .eq("business_id", businessId)
      .select("*")
      .single();
    if (error) throw new Error(`app_settings update failed: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from("app_settings")
    .insert({ business_id: businessId, ...patch })
    .select("*")
    .single();
  if (error) throw new Error(`app_settings insert failed: ${error.message}`);
  return data;
}
