import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

export type StaffMember = Tables<"staff_members">;

export async function listStaffByBusinessId(
  businessId: string,
): Promise<StaffMember[]> {
  if (isDemoMode) {
    const { demoStaffStore } = await import("@/lib/demo/staff-store");
    return demoStaffStore.list(businessId);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw new Error(`staff_members list failed: ${error.message}`);
  return data ?? [];
}

export async function findStaffById(
  businessId: string,
  id: string,
): Promise<StaffMember | null> {
  if (isDemoMode) {
    const { demoStaffStore } = await import("@/lib/demo/staff-store");
    const row = demoStaffStore.findById(id);
    return row?.business_id === businessId ? row : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`staff_members lookup failed: ${error.message}`);
  return data ?? null;
}

export async function updateStaffMember(
  businessId: string,
  id: string,
  patch: TablesUpdate<"staff_members">,
): Promise<StaffMember> {
  if (isDemoMode) {
    const { demoStaffStore } = await import("@/lib/demo/staff-store");
    const existing = demoStaffStore.findById(id);
    if (!existing || existing.business_id !== businessId) {
      throw new Error("staff member not found");
    }
    return demoStaffStore.update(id, patch);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`staff_members update failed: ${error.message}`);
  return data;
}
