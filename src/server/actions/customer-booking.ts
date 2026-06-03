"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { extractFirstName } from "@/lib/customer/name";
import { isValidPhone } from "@/lib/customer/phone";
import { customerBookingPath, customerMyAppointmentsPath } from "@/lib/tenant/customer-portal-paths";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import {
  cancelPublicBookingAppointment,
  countPublicBookingAppointmentsOnDay,
  createPublicBookingAppointment,
  findCustomerByPhoneAndBusinessId,
  upsertCustomerForPublicBooking,
  listAppointmentsForCustomerPhone,
} from "@/server/repositories/public-booking";
import {
  getAvailableSlotsForCustomer,
  getCustomerBookingDatesWithSlots,
  maxBookingDateString,
  validateAppointmentSlot,
} from "@/server/services/appointment-slot.service";
import { tenantService } from "@/server/services";
import type { AvailableSlot } from "@/lib/calendar/types";
import type { Appointment } from "@/server/repositories/appointments";

export type BookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string };

const BusinessSlugSchema = z.object({
  businessSlug: z.string().trim().min(1).max(64),
});

const PhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .refine(isValidPhone, { message: "invalid_phone" });

const CustomerSlotsSchema = BusinessSlugSchema.extend({
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const BookAppointmentSchema = BusinessSlugSchema.extend({
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  startsAt: z.string().min(1),
  fullName: z.string().trim().min(1).max(200),
  phone: PhoneSchema,
  email: z
    .union([z.string().trim().max(320), z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      return v.trim();
    })
    .refine((v) => v === null || z.string().email().safeParse(v).success, {
      message: "invalid_email",
    }),
  smsConsent: z.boolean().optional().default(false),
  whatsappConsent: z.boolean().optional().default(false),
  emailConsent: z.boolean().optional().default(false),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const CancelAppointmentSchema = BusinessSlugSchema.extend({
  appointmentId: z.string().uuid(),
  phone: PhoneSchema,
  cancellationReason: z.string().trim().min(1).max(500),
});

const IdentifyCustomerSchema = BusinessSlugSchema.extend({
  phone: PhoneSchema,
});

const MonthAvailabilitySchema = BusinessSlugSchema.extend({
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

/** Invalidate customer portal + manager calendar after booking mutations. */
function revalidateBookingViews(businessSlug: string) {
  revalidatePath(customerBookingPath(businessSlug));
  revalidatePath(customerMyAppointmentsPath(businessSlug));
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/availability");
}

async function resolveActiveBusiness(slug: string) {
  const business = await tenantService.getPublicBusinessBySlug(slug);
  if (!business || business.status !== "active") return null;
  return business;
}

function dayBoundsForStartsAt(startsAt: Date): { dayStart: string; dayEnd: string } {
  const dayStart = new Date(startsAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startsAt);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() };
}

export type IdentifiedCustomer = {
  found: boolean;
  firstName: string | null;
  fullName: string | null;
  email: string | null;
  smsConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
};

export async function identifyCustomerAction(
  input: unknown,
): Promise<{ ok: true; customer: IdentifiedCustomer } | { ok: false; error: string }> {
  try {
    const parsed = IdentifyCustomerSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const row = await findCustomerByPhoneAndBusinessId(
      business.id,
      parsed.data.phone,
    );

    if (!row) {
      return {
        ok: true,
        customer: {
          found: false,
          firstName: null,
          fullName: null,
          email: null,
          smsConsent: false,
          whatsappConsent: false,
          emailConsent: false,
        },
      };
    }

    return {
      ok: true,
      customer: {
        found: true,
        firstName: extractFirstName(row.full_name),
        fullName: row.full_name,
        email: row.email,
        smsConsent: row.sms_consent,
        whatsappConsent: row.whatsapp_consent,
        emailConsent: row.email_consent,
      },
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function getBookingMonthAvailabilityAction(
  input: unknown,
): Promise<{ ok: true; dates: string[] } | { ok: false; error: string }> {
  try {
    const parsed = MonthAvailabilitySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const settings = await findSettingsByBusinessId(business.id);
    const bookingWindowDays = settings?.booking_window_days ?? 30;
    const minHours = settings?.min_hours_before_booking ?? 0;

    const [year, month] = parsed.data.month.split("-").map(Number);
    const monthStart = `${parsed.data.month}-01`;
    const monthEnd = `${parsed.data.month}-${String(new Date(year!, month!, 0).getDate()).padStart(2, "0")}`;

    const dates = await getCustomerBookingDatesWithSlots(
      {
        businessId: business.id,
        serviceId: parsed.data.serviceId,
        staffMemberId: parsed.data.staffMemberId,
        date: monthStart,
        from: monthStart,
        to: monthEnd,
      },
      {
        minHoursBefore: minHours,
        maxBookingDate: maxBookingDateString(bookingWindowDays),
      },
    );

    return { ok: true, dates };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

const LookupAppointmentsSchema = BusinessSlugSchema.extend({
  phone: PhoneSchema,
});

export async function getAvailableSlotsForCustomerAction(
  input: unknown,
): Promise<{ ok: true; slots: AvailableSlot[] } | { ok: false; error: string }> {
  try {
    const parsed = CustomerSlotsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const settings = await findSettingsByBusinessId(business.id);
    const bookingWindowDays = settings?.booking_window_days ?? 30;
    const minHours = settings?.min_hours_before_booking ?? 0;

    const slots = await getAvailableSlotsForCustomer(
      {
        businessId: business.id,
        serviceId: parsed.data.serviceId,
        staffMemberId: parsed.data.staffMemberId,
        date: parsed.data.date,
      },
      {
        minHoursBefore: minHours,
        maxBookingDate: maxBookingDateString(bookingWindowDays),
      },
    );

    return { ok: true, slots };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function lookupCustomerAppointmentsAction(
  input: unknown,
): Promise<
  | { ok: true; appointments: Appointment[]; customerName: string | null }
  | { ok: false; error: string }
> {
  try {
    const parsed = LookupAppointmentsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const customer = await findCustomerByPhoneAndBusinessId(
      business.id,
      parsed.data.phone,
    );
    if (!customer) {
      return { ok: true, appointments: [], customerName: null };
    }

    const rows = await listAppointmentsForCustomerPhone(
      business.id,
      parsed.data.phone,
    );

    const now = Date.now();
    const upcoming = rows.filter(
      (a) =>
        (a.status === "pending" || a.status === "confirmed") &&
        new Date(a.starts_at).getTime() >= now,
    );

    return {
      ok: true,
      appointments: upcoming,
      customerName: customer.full_name,
    };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function bookCustomerAppointment(input: unknown): Promise<BookingResult> {
  try {
    const parsed = BookAppointmentSchema.safeParse(input);
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.message;
      if (code === "invalid_email") return { ok: false, error: "invalid_email" };
      return { ok: false, error: "invalid_input" };
    }

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const settings = await findSettingsByBusinessId(business.id);
    const bookingWindowDays = settings?.booking_window_days ?? 30;
    const minHours = settings?.min_hours_before_booking ?? 0;
    const maxPerDay = settings?.max_appointments_per_customer_per_day ?? 1;

    const startsAt = new Date(parsed.data.startsAt);
    if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "invalid_time" };

    const dateStr = parsed.data.startsAt.slice(0, 10);
    if (dateStr > maxBookingDateString(bookingWindowDays)) {
      return { ok: false, error: "outside_booking_window" };
    }

    const minStart = Date.now() + minHours * 3_600_000;
    if (startsAt.getTime() < minStart) {
      return { ok: false, error: "too_soon" };
    }

    const slot = await validateAppointmentSlot({
      businessId: business.id,
      serviceId: parsed.data.serviceId,
      staffMemberId: parsed.data.staffMemberId,
      startsAt,
    });
    if (!slot.ok) return { ok: false, error: slot.reason };

    const customer = await upsertCustomerForPublicBooking({
      businessId: business.id,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      smsConsent: parsed.data.smsConsent,
      whatsappConsent: parsed.data.whatsappConsent,
      emailConsent: parsed.data.emailConsent,
    });

    const { dayStart, dayEnd } = dayBoundsForStartsAt(startsAt);
    const dayCount = await countPublicBookingAppointmentsOnDay(
      business.id,
      customer.id,
      dayStart,
      dayEnd,
    );
    if (dayCount >= maxPerDay) {
      return { ok: false, error: "daily_limit_reached" };
    }

    const appointment = await createPublicBookingAppointment({
      business_id: business.id,
      customer_id: customer.id,
      service_id: parsed.data.serviceId,
      staff_member_id: parsed.data.staffMemberId,
      starts_at: startsAt.toISOString(),
      ends_at: slot.endsAt.toISOString(),
      status: "confirmed",
      notes: parsed.data.notes ?? null,
    });

    revalidateBookingViews(parsed.data.businessSlug);
    return { ok: true, appointmentId: appointment.id };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("slot_unavailable")) return { ok: false, error: "slot_unavailable" };
      if (err.message.includes("public_booking_unavailable")) {
        return { ok: false, error: "booking_unavailable" };
      }
    }
    return { ok: false, error: "unknown" };
  }
}

export async function cancelCustomerAppointment(
  input: unknown,
): Promise<BookingResult> {
  try {
    const parsed = CancelAppointmentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const business = await resolveActiveBusiness(parsed.data.businessSlug);
    if (!business) return { ok: false, error: "business_not_found" };

    const settings = await findSettingsByBusinessId(business.id);
    if (settings && !settings.allow_customer_cancellation) {
      return { ok: false, error: "cancellation_not_allowed" };
    }

    const customer = await findCustomerByPhoneAndBusinessId(
      business.id,
      parsed.data.phone,
    );
    if (!customer) return { ok: false, error: "not_found" };

    const appointments = await listAppointmentsForCustomerPhone(
      business.id,
      parsed.data.phone,
    );
    const appointment = appointments.find((a) => a.id === parsed.data.appointmentId);
    if (!appointment) return { ok: false, error: "not_found" };

    if (appointment.status !== "pending" && appointment.status !== "confirmed") {
      return { ok: false, error: "cannot_cancel" };
    }

    const minHours = settings?.cancellation_min_hours ?? 0;
    const hoursUntil =
      (new Date(appointment.starts_at).getTime() - Date.now()) / 3_600_000;
    if (hoursUntil < minHours) {
      return { ok: false, error: "cancellation_too_late" };
    }

    await cancelPublicBookingAppointment(
      business.id,
      appointment.id,
      customer.id,
      parsed.data.cancellationReason,
    );

    revalidateBookingViews(parsed.data.businessSlug);
    return { ok: true, appointmentId: appointment.id };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
