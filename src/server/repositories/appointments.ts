import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type {
  AppointmentListFilters,
  CalendarAppointment,
  CalendarAppointmentDetail,
} from "@/lib/calendar/types";
import type { AppointmentStatus, PaymentStatus } from "@/types/database";
import { listAuditLogsForEntity } from "./audit-logs";

export type Appointment = Tables<"appointments">;

type CustomerSlice = Pick<
  Tables<"customers">,
  | "id"
  | "full_name"
  | "phone"
  | "email"
  | "sms_consent"
  | "whatsapp_consent"
  | "email_consent"
>;
type ServiceSlice = Pick<Tables<"services">, "id" | "name" | "duration_minutes">;
type StaffSlice = Pick<Tables<"staff_members">, "id" | "name" | "color">;
type PaymentSlice = Pick<Tables<"payments">, "appointment_id" | "status" | "created_at">;

function mapEnrichedAppointment(
  row: Appointment,
  customers: Map<string, CustomerSlice>,
  services: Map<string, ServiceSlice>,
  staff: Map<string, StaffSlice>,
  paymentsByAppointment: Map<string, PaymentStatus>,
): CalendarAppointment {
  const customer = customers.get(row.customer_id);
  const service = services.get(row.service_id);
  const staffMember = staff.get(row.staff_member_id);

  return {
    id: row.id,
    businessId: row.business_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes,
    internalNotes: row.internal_notes,
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: {
      id: customer?.id ?? row.customer_id,
      fullName: customer?.full_name ?? "—",
      phone: customer?.phone ?? null,
      email: customer?.email ?? null,
      smsConsent: customer?.sms_consent ?? false,
      whatsappConsent: customer?.whatsapp_consent ?? false,
      emailConsent: customer?.email_consent ?? false,
    },
    service: {
      id: service?.id ?? row.service_id,
      name: service?.name ?? "—",
      durationMinutes: service?.duration_minutes ?? 0,
    },
    staff: {
      id: staffMember?.id ?? row.staff_member_id,
      name: staffMember?.name ?? "—",
      color: staffMember?.color ?? null,
    },
    paymentStatus: paymentsByAppointment.get(row.id) ?? null,
  };
}

async function enrichAppointments(
  businessId: string,
  rows: Appointment[],
): Promise<CalendarAppointment[]> {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const serviceIds = [...new Set(rows.map((row) => row.service_id))];
  const staffIds = [...new Set(rows.map((row) => row.staff_member_id))];
  const appointmentIds = rows.map((row) => row.id);

  const [customersRes, servicesRes, staffRes, paymentsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, email, sms_consent, whatsapp_consent, email_consent")
      .eq("business_id", businessId)
      .in("id", customerIds),
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("business_id", businessId)
      .in("id", serviceIds),
    supabase
      .from("staff_members")
      .select("id, name, color")
      .eq("business_id", businessId)
      .in("id", staffIds),
    supabase
      .from("payments")
      .select("appointment_id, status, created_at")
      .eq("business_id", businessId)
      .in("appointment_id", appointmentIds),
  ]);

  if (customersRes.error) {
    throw new Error(`customers batch failed: ${customersRes.error.message}`);
  }
  if (servicesRes.error) {
    throw new Error(`services batch failed: ${servicesRes.error.message}`);
  }
  if (staffRes.error) {
    throw new Error(`staff batch failed: ${staffRes.error.message}`);
  }
  if (paymentsRes.error) {
    throw new Error(`payments batch failed: ${paymentsRes.error.message}`);
  }

  const customers = new Map(
    (customersRes.data as CustomerSlice[]).map((row) => [row.id, row]),
  );
  const services = new Map(
    (servicesRes.data as ServiceSlice[]).map((row) => [row.id, row]),
  );
  const staff = new Map((staffRes.data as StaffSlice[]).map((row) => [row.id, row]));

  const paymentsByAppointment = new Map<string, PaymentStatus>();
  for (const payment of (paymentsRes.data as PaymentSlice[]) ?? []) {
    if (!payment.appointment_id) continue;
    paymentsByAppointment.set(payment.appointment_id, payment.status);
  }

  return rows.map((row) =>
    mapEnrichedAppointment(row, customers, services, staff, paymentsByAppointment),
  );
}

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

export async function listAppointmentsWithDetails(
  businessId: string,
  filters: AppointmentListFilters = {},
): Promise<CalendarAppointment[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true });

  if (filters.from) query = query.gte("starts_at", filters.from);
  if (filters.to) query = query.lte("starts_at", filters.to);
  if (filters.staffMemberId) query = query.eq("staff_member_id", filters.staffMemberId);
  if (filters.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`appointments list failed: ${error.message}`);
  return enrichAppointments(businessId, data ?? []);
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

export async function findAppointmentDetailById(
  businessId: string,
  id: string,
): Promise<CalendarAppointmentDetail | null> {
  if (isDemoMode) return null;
  const row = await findAppointmentById(businessId, id);
  if (!row) return null;

  const [appointment] = await enrichAppointments(businessId, [row]);
  const auditEvents = await listAuditLogsForEntity({
    businessId,
    entityType: "appointment",
    entityId: id,
    limit: 20,
  });

  return {
    ...appointment,
    auditEvents: auditEvents.map((log) => ({
      action: log.action,
      createdAt: log.created_at,
      userId: log.user_id,
      metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    })),
  };
}

export async function findAppointmentForCustomer(
  businessId: string,
  appointmentId: string,
  customerId: string,
): Promise<Appointment | null> {
  if (isDemoMode) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", appointmentId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw new Error(`appointments customer lookup failed: ${error.message}`);
  return data ?? null;
}

export async function countCustomerAppointmentsOnLocalDay(
  businessId: string,
  customerId: string,
  dayStartIso: string,
  dayEndIso: string,
): Promise<number> {
  if (isDemoMode) return 0;
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", dayStartIso)
    .lt("starts_at", dayEndIso);
  if (error) {
    throw new Error(`appointments customer day count failed: ${error.message}`);
  }
  return count ?? 0;
}

export async function listAppointmentsForCustomerAtBusiness(
  businessId: string,
  customerId: string,
): Promise<Appointment[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(`appointments customer list failed: ${error.message}`);
  return data ?? [];
}

export async function listActiveAppointmentsForStaffInRange(
  businessId: string,
  staffMemberId: string,
  from: string,
  to: string,
  excludeAppointmentId?: string,
): Promise<Appointment[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_member_id", staffMemberId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`appointments staff range failed: ${error.message}`);
  return data ?? [];
}

export async function listActiveAppointmentsInRange(
  businessId: string,
  from: string,
  to: string,
): Promise<Appointment[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from);
  if (error) throw new Error(`appointments range failed: ${error.message}`);
  return data ?? [];
}

export async function createAppointment(
  input: TablesInsert<"appointments">,
): Promise<Appointment> {
  if (isDemoMode) {
    throw new Error("appointments not supported in demo mode");
  }
  const supabase = await createSupabaseServerClient();
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

/** @deprecated use createAppointment */
export async function createCustomerAppointment(
  input: TablesInsert<"appointments">,
): Promise<Appointment> {
  return createAppointment(input);
}

export async function updateAppointment(
  businessId: string,
  id: string,
  patch: TablesUpdate<"appointments">,
): Promise<Appointment> {
  if (isDemoMode) {
    throw new Error("appointments not supported in demo mode");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("business_id", businessId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.message.includes("appointments_no_staff_overlap")) {
      throw new Error("slot_unavailable");
    }
    throw new Error(`appointments update failed: ${error.message}`);
  }
  return data;
}

export async function changeAppointmentStatus(
  businessId: string,
  id: string,
  status: AppointmentStatus,
  extra?: Pick<
    TablesUpdate<"appointments">,
    "cancellation_reason" | "cancelled_at" | "internal_notes"
  >,
): Promise<Appointment> {
  return updateAppointment(businessId, id, { status, ...extra });
}
