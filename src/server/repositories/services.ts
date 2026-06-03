import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Service = Tables<"services">;

export async function listPublicActiveServicesByBusinessId(
  businessId: string,
): Promise<Service[]> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    return demoServicesStore.list(businessId).filter((row) => row.active);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("name");
  if (error) throw new Error(`services public list failed: ${error.message}`);
  return data ?? [];
}

export async function listServicesByBusinessId(
  businessId: string,
): Promise<Service[]> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    return demoServicesStore.list(businessId);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw new Error(`services list failed: ${error.message}`);
  return data ?? [];
}

export async function findServiceById(
  businessId: string,
  id: string,
): Promise<Service | null> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    const row = demoServicesStore.findById(id);
    return row?.business_id === businessId ? row : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`services lookup failed: ${error.message}`);
  return data ?? null;
}

export async function updateService(
  businessId: string,
  id: string,
  patch: TablesUpdate<"services">,
): Promise<Service> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    const existing = demoServicesStore.findById(id);
    if (!existing || existing.business_id !== businessId) {
      throw new Error("service not found");
    }
    return demoServicesStore.update(id, patch);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`services update failed: ${error.message}`);
  return data;
}

export async function createService(
  businessId: string,
  input: Omit<TablesInsert<"services">, "business_id" | "id">,
): Promise<Service> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    return demoServicesStore.create({ ...input, business_id: businessId });
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .insert({ ...input, business_id: businessId })
    .select("*")
    .single();
  if (error) throw new Error(`services create failed: ${error.message}`);
  return data;
}

export async function deleteService(
  businessId: string,
  id: string,
): Promise<void> {
  if (isDemoMode) {
    const { demoServicesStore } = await import("@/lib/demo/services-store");
    const existing = demoServicesStore.findById(id);
    if (!existing || existing.business_id !== businessId) {
      throw new Error("service not found");
    }
    demoServicesStore.delete(id);
    return;
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id);
  if (error) throw new Error(`services delete failed: ${error.message}`);
}
