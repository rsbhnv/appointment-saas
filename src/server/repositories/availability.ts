import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AvailabilityRule = Tables<"availability_rules">;
export type AvailabilityException = Tables<"availability_exceptions">;
export type SlotOverride = Tables<"slot_overrides">;

export async function listAvailabilityRules(
  businessId: string,
): Promise<AvailabilityRule[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true);
  if (error) throw new Error(`availability_rules list failed: ${error.message}`);
  return data ?? [];
}

export async function listAvailabilityExceptions(
  businessId: string,
): Promise<AvailabilityException[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("business_id", businessId);
  if (error) {
    throw new Error(`availability_exceptions list failed: ${error.message}`);
  }
  return data ?? [];
}

export async function listSlotOverrides(
  businessId: string,
): Promise<SlotOverride[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("slot_overrides")
    .select("*")
    .eq("business_id", businessId);
  if (error) throw new Error(`slot_overrides list failed: ${error.message}`);
  return data ?? [];
}
