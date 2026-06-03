import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

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
    .order("day_of_week")
    .order("start_time");
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
    .eq("business_id", businessId)
    .order("exception_date", { ascending: false });
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
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false });
  if (error) throw new Error(`slot_overrides list failed: ${error.message}`);
  return data ?? [];
}

export async function createAvailabilityRule(
  businessId: string,
  input: Omit<TablesInsert<"availability_rules">, "business_id" | "id">,
): Promise<AvailabilityRule> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .insert({ ...input, business_id: businessId })
    .select("*")
    .single();
  if (error) throw new Error(`availability_rules create failed: ${error.message}`);
  return data;
}

export async function updateAvailabilityRule(
  businessId: string,
  id: string,
  patch: TablesUpdate<"availability_rules">,
): Promise<AvailabilityRule> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`availability_rules update failed: ${error.message}`);
  return data;
}

export async function deleteAvailabilityRule(
  businessId: string,
  id: string,
): Promise<void> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id);
  if (error) throw new Error(`availability_rules delete failed: ${error.message}`);
}

export async function createAvailabilityException(
  businessId: string,
  input: Omit<TablesInsert<"availability_exceptions">, "business_id" | "id">,
): Promise<AvailabilityException> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .insert({ ...input, business_id: businessId })
    .select("*")
    .single();
  if (error) {
    throw new Error(`availability_exceptions create failed: ${error.message}`);
  }
  return data;
}

export async function updateAvailabilityException(
  businessId: string,
  id: string,
  patch: TablesUpdate<"availability_exceptions">,
): Promise<AvailabilityException> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`availability_exceptions update failed: ${error.message}`);
  }
  return data;
}

export async function deleteAvailabilityException(
  businessId: string,
  id: string,
): Promise<void> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("availability_exceptions")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id);
  if (error) {
    throw new Error(`availability_exceptions delete failed: ${error.message}`);
  }
}

export type ReplaceDateAvailabilityInput = {
  closed: boolean;
  ranges: { start_time: string; end_time: string }[];
  reason?: string | null;
};

/** Replaces all date-specific rows for the given dates and staff scope. */
export async function replaceDateAvailabilityExceptions(
  businessId: string,
  dates: string[],
  staffMemberId: string | null,
  payload: ReplaceDateAvailabilityInput,
): Promise<void> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  if (dates.length === 0) return;

  const supabase = await createSupabaseServerClient();

  let deleteQuery = supabase
    .from("availability_exceptions")
    .delete()
    .eq("business_id", businessId)
    .in("exception_date", dates);

  deleteQuery = staffMemberId
    ? deleteQuery.eq("staff_member_id", staffMemberId)
    : deleteQuery.is("staff_member_id", null);

  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    throw new Error(
      `availability_exceptions bulk delete failed: ${deleteError.message}`,
    );
  }

  if (payload.closed) {
    const { error: insertError } = await supabase
      .from("availability_exceptions")
      .insert(
        dates.map((exception_date) => ({
          business_id: businessId,
          staff_member_id: staffMemberId,
          exception_date,
          closed: true,
          start_time: null,
          end_time: null,
          reason: payload.reason ?? null,
        })),
      );
    if (insertError) {
      throw new Error(
        `availability_exceptions closed insert failed: ${insertError.message}`,
      );
    }
    return;
  }

  if (payload.ranges.length === 0) return;

  const { error: insertError } = await supabase.from("availability_exceptions").insert(
    dates.flatMap((exception_date) =>
      payload.ranges.map((range) => ({
        business_id: businessId,
        staff_member_id: staffMemberId,
        exception_date,
        closed: false,
        start_time: range.start_time,
        end_time: range.end_time,
        reason: payload.reason ?? null,
      })),
    ),
  );
  if (insertError) {
    throw new Error(
      `availability_exceptions bulk insert failed: ${insertError.message}`,
    );
  }
}

export async function createSlotOverride(
  businessId: string,
  input: Omit<TablesInsert<"slot_overrides">, "business_id" | "id">,
): Promise<SlotOverride> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("slot_overrides")
    .insert({ ...input, business_id: businessId })
    .select("*")
    .single();
  if (error) throw new Error(`slot_overrides create failed: ${error.message}`);
  return data;
}

export async function deleteSlotOverride(
  businessId: string,
  id: string,
): Promise<void> {
  if (isDemoMode) throw new Error("availability not supported in demo mode");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("slot_overrides")
    .delete()
    .eq("business_id", businessId)
    .eq("id", id);
  if (error) throw new Error(`slot_overrides delete failed: ${error.message}`);
}
