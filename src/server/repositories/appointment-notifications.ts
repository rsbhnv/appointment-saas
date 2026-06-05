import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { isSupabaseAdminConfigured } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export type AppointmentSmsContext = {
  appointmentId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  startsAt: string;
  customerFirstName: string;
  customerPhone: string | null;
  smsConsent: boolean;
};

export type AppointmentReminderCandidate = AppointmentSmsContext & {
  reminderSentAt: string | null;
};

function requireAdmin() {
  if (isDemoMode || !isSupabaseAdminConfigured) {
    throw new Error("sms_context_unavailable");
  }
  return createSupabaseAdminClient();
}

async function loadRelatedSmsData(
  appointment: Tables<"appointments">,
): Promise<AppointmentSmsContext | null> {
  const supabase = requireAdmin();

  const [customerResult, businessResult, serviceResult] = await Promise.all([
    supabase
      .from("customers")
      .select("full_name, phone, sms_consent")
      .eq("business_id", appointment.business_id)
      .eq("id", appointment.customer_id)
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("name, slug")
      .eq("id", appointment.business_id)
      .maybeSingle(),
    supabase
      .from("services")
      .select("name")
      .eq("business_id", appointment.business_id)
      .eq("id", appointment.service_id)
      .maybeSingle(),
  ]);

  if (customerResult.error || businessResult.error || serviceResult.error) {
    return null;
  }

  const customer = customerResult.data;
  const business = businessResult.data;
  const service = serviceResult.data;

  if (!customer || !business || !service) return null;

  const fullName = customer.full_name?.trim() ?? "";
  const firstName = fullName.split(/\s+/)[0] ?? fullName;

  return {
    appointmentId: appointment.id,
    businessId: appointment.business_id,
    businessName: business.name,
    businessSlug: business.slug,
    serviceName: service.name,
    startsAt: appointment.starts_at,
    customerFirstName: firstName || "לקוח/ה",
    customerPhone: customer.phone,
    smsConsent: customer.sms_consent ?? false,
  };
}

export async function loadAppointmentSmsContext(
  appointmentId: string,
): Promise<AppointmentSmsContext | null> {
  if (isDemoMode || !isSupabaseAdminConfigured) return null;

  const supabase = requireAdmin();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !appointment) return null;

  return loadRelatedSmsData(appointment);
}

/** Appointments starting in ~24 hours (23–25h window) that still need a reminder. */
export async function listAppointmentsDueForReminder(): Promise<AppointmentReminderCandidate[]> {
  if (isDemoMode || !isSupabaseAdminConfigured) return [];

  const supabase = requireAdmin();
  const now = Date.now();
  const windowStart = new Date(now + 23 * 3_600_000).toISOString();
  const windowEnd = new Date(now + 25 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .is("reminder_sent_at", null)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", windowStart)
    .lt("starts_at", windowEnd);

  if (error) {
    throw new Error(`reminder query failed: ${error.message}`);
  }

  const rows = data ?? [];
  const contexts: AppointmentReminderCandidate[] = [];

  for (const appointment of rows) {
    const context = await loadRelatedSmsData(appointment);
    if (!context) continue;
    contexts.push({
      ...context,
      reminderSentAt: appointment.reminder_sent_at,
    });
  }

  return contexts;
}

export async function markAppointmentReminderSent(
  businessId: string,
  appointmentId: string,
): Promise<boolean> {
  if (isDemoMode || !isSupabaseAdminConfigured) return false;

  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("id", appointmentId)
    .is("reminder_sent_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`reminder mark failed: ${error.message}`);
  }

  return Boolean(data);
}
