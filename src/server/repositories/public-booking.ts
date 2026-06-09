import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { isSupabaseAdminConfigured } from "@/lib/env/server";
import { normalizePhone } from "@/lib/customer/phone";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/types/database";

type Customer = Tables<"customers">;
type Appointment = Tables<"appointments">;

function requireAdminClient() {
  if (isDemoMode || !isSupabaseAdminConfigured) {
    throw new Error("public_booking_unavailable");
  }
  return createSupabaseAdminClient();
}

function phonesMatch(a: string | null, b: string): boolean {
  if (!a) return false;
  return normalizePhone(a) === normalizePhone(b);
}

/** Lookup customer scoped to business_id + normalized phone. */
export async function findCustomerByPhoneAndBusinessId(
  businessId: string,
  phone: string,
): Promise<Customer | null> {
  if (isDemoMode) return null;

  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .not("phone", "is", null);

  if (error) throw new Error(`customers phone lookup failed: ${error.message}`);

  return (data ?? []).find((row) => phonesMatch(row.phone, phone)) ?? null;
}

/** Reuse existing customer or create one — always scoped to business_id + phone. */
export type PublicCustomerUpsertInput = {
  businessId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  smsConsent?: boolean;
  whatsappConsent?: boolean;
  emailConsent?: boolean;
};

export async function upsertCustomerForPublicBooking(
  input: PublicCustomerUpsertInput,
): Promise<Customer> {
  if (isDemoMode) {
    throw new Error("booking not supported in demo mode");
  }

  const existing = await findCustomerByPhoneAndBusinessId(input.businessId, input.phone);
  const trimmedName = input.fullName.trim();
  const displayPhone = input.phone.trim();
  const email = input.email?.trim() || null;
  const patch = {
    full_name: trimmedName,
    email,
    sms_consent: input.smsConsent ?? false,
    whatsapp_consent: input.whatsappConsent ?? false,
    email_consent: input.emailConsent ?? false,
  };

  const supabase = requireAdminClient();

  if (existing) {
    const { data, error } = await supabase
      .from("customers")
      .update(patch)
      .eq("business_id", input.businessId)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(`customers update failed: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: input.businessId,
      phone: displayPhone,
      ...patch,
    })
    .select("*")
    .single();

  if (error) throw new Error(`customers create failed: ${error.message}`);
  return data;
}

/** @deprecated Use upsertCustomerForPublicBooking */
export async function findOrCreateCustomerByPhone(
  businessId: string,
  fullName: string,
  phone: string,
): Promise<Customer> {
  return upsertCustomerForPublicBooking({ businessId, fullName, phone });
}

export async function listAppointmentsForCustomerPhone(
  businessId: string,
  phone: string,
): Promise<Appointment[]> {
  if (isDemoMode) return [];

  const customer = await findCustomerByPhoneAndBusinessId(businessId, phone);
  if (!customer) return [];

  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_id", customer.id)
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`appointments phone list failed: ${error.message}`);
  return data ?? [];
}

export async function createPublicBookingAppointment(
  input: TablesInsert<"appointments">,
): Promise<Appointment> {
  if (isDemoMode) {
    throw new Error("booking not supported in demo mode");
  }

  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("appointments_no_staff_overlap")) {
      throw new Error("slot_unavailable");
    }
    throw new Error(`appointments create failed: ${error.message}`);
  }
  return data;
}

export async function cancelPublicBookingAppointment(
  businessId: string,
  appointmentId: string,
  customerId: string,
  cancellationReason: string,
): Promise<Appointment> {
  if (isDemoMode) {
    throw new Error("booking not supported in demo mode");
  }

  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .eq("id", appointmentId)
    .eq("customer_id", customerId)
    .in("status", ["pending", "confirmed"])
    .select("*")
    .single();

  if (error) throw new Error(`appointments cancel failed: ${error.message}`);
  return data;
}

export async function countPublicBookingAppointmentsOnDay(
  businessId: string,
  customerId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<number> {
  return countPublicBookingAppointmentsInRange(
    businessId,
    customerId,
    dayStartIso,
    dayEndIso,
  );
}

export async function countPublicBookingAppointmentsInRange(
  businessId: string,
  customerId: string,
  rangeStartIso: string,
  rangeEndExclusiveIso: string,
): Promise<number> {
  if (isDemoMode) return 0;

  const supabase = requireAdminClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", rangeStartIso)
    .lt("starts_at", rangeEndExclusiveIso);

  if (error) {
    throw new Error(`appointments range count failed: ${error.message}`);
  }
  return count ?? 0;
}
