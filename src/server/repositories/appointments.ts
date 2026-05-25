import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Appointment = Tables<"appointments">;

export async function listAppointmentsByBusinessId(
  businessId: string,
): Promise<Appointment[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(`appointments list failed: ${error.message}`);
  return data ?? [];
}

export async function findAppointmentById(
  businessId: string,
  id: string,
): Promise<Appointment | null> {
  if (isDemoMode) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`appointments lookup failed: ${error.message}`);
  return data ?? null;
}
