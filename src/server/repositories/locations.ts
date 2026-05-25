import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Location = Tables<"locations">;

export async function listLocationsByBusinessId(
  businessId: string,
): Promise<Location[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true);
  if (error) throw new Error(`locations list failed: ${error.message}`);
  return data ?? [];
}
