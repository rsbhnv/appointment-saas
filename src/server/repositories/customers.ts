import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Customer = Tables<"customers">;

export async function listCustomersByBusinessId(
  businessId: string,
): Promise<Customer[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("full_name");
  if (error) throw new Error(`customers list failed: ${error.message}`);
  return data ?? [];
}

export async function findCustomerById(
  businessId: string,
  id: string,
): Promise<Customer | null> {
  if (isDemoMode) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`customers lookup failed: ${error.message}`);
  return data ?? null;
}
