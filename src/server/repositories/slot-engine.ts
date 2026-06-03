import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { isSupabaseAdminConfigured } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AvailabilityException,
  AvailabilityRule,
  SlotOverride,
} from "@/server/repositories/availability";

export type OccupiedAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  staff_member_id: string;
};

async function requireSlotEngineClient() {
  if (isDemoMode) {
    throw new Error("slot-engine unavailable in demo mode");
  }
  if (!isSupabaseAdminConfigured) {
    throw new Error("slot-engine requires SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseAdminClient();
}

/** Trusted read — slot computation must see all occupancy, not only the caller's rows. */
export async function listOccupiedAppointmentsForStaffInRange(
  businessId: string,
  staffMemberId: string,
  from: string,
  to: string,
  excludeAppointmentId?: string,
): Promise<OccupiedAppointment[]> {
  if (isDemoMode) return [];

  const supabase = await requireSlotEngineClient();
  let query = supabase
    .from("appointments")
    .select("id, starts_at, ends_at, staff_member_id")
    .eq("business_id", businessId)
    .eq("staff_member_id", staffMemberId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`slot-engine staff occupancy failed: ${error.message}`);
  }
  return data ?? [];
}

export async function listOccupiedAppointmentsInRange(
  businessId: string,
  from: string,
  to: string,
): Promise<OccupiedAppointment[]> {
  if (isDemoMode) return [];

  const supabase = await requireSlotEngineClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, staff_member_id")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from);

  if (error) {
    throw new Error(`slot-engine occupancy failed: ${error.message}`);
  }
  return data ?? [];
}

export async function listAvailabilityRulesForSlotEngine(
  businessId: string,
): Promise<AvailabilityRule[]> {
  if (isDemoMode) return [];

  const supabase = await requireSlotEngineClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    throw new Error(`slot-engine availability_rules failed: ${error.message}`);
  }
  return data ?? [];
}

export async function listAvailabilityExceptionsForSlotEngine(
  businessId: string,
): Promise<AvailabilityException[]> {
  if (isDemoMode) return [];

  const supabase = await requireSlotEngineClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("business_id", businessId)
    .order("exception_date", { ascending: false });

  if (error) {
    throw new Error(`slot-engine availability_exceptions failed: ${error.message}`);
  }
  return data ?? [];
}

export async function listSlotOverridesForSlotEngine(
  businessId: string,
): Promise<SlotOverride[]> {
  if (isDemoMode) return [];

  const supabase = await requireSlotEngineClient();
  const { data, error } = await supabase
    .from("slot_overrides")
    .select("*")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(`slot-engine slot_overrides failed: ${error.message}`);
  }
  return data ?? [];
}
