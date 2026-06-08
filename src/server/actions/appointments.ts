"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type {
  AppointmentListFilters,
  AvailableSlot,
  CalendarAvailableSlot,
  CalendarAppointment,
  CalendarAppointmentDetail,
} from "@/lib/calendar/types";
import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import {
  changeAppointmentStatus,
  createAppointment,
  findAppointmentDetailById,
  listAppointmentsWithDetails,
  updateAppointment,
} from "@/server/repositories/appointments";
import { findCustomerById } from "@/server/repositories/customers";
import { findServiceById } from "@/server/repositories/services";
import { findStaffById } from "@/server/repositories/staff-members";
import {
  getAvailableSlotsForAdmin,
  listCalendarAvailableSlots,
  validateAppointmentSlot,
} from "@/server/services/appointment-slot.service";
import { scheduleBookingConfirmationSms } from "@/server/services/appointment-sms.service";
import { withAudit } from "@/server/services/with-audit";
import type { AppointmentStatus } from "@/types/database";

import { actionError, type ActionResult } from "./action-result";

const CALENDAR_PATH = "/dashboard/calendar";

const AppointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

const ListFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  staffMemberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  status: AppointmentStatusSchema.optional(),
});

const AvailabilitySlotsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  staffMemberId: z.string().uuid().optional(),
});

const AppointmentIdSchema = z.object({
  id: z.string().uuid(),
});

const ManualAppointmentSchema = z.object({
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  startsAt: z.string().min(1),
  notes: z.string().trim().max(2000).optional().nullable(),
  internalNotes: z.string().trim().max(2000).optional().nullable(),
  status: AppointmentStatusSchema.default("confirmed"),
});

const UpdateAppointmentSchema = ManualAppointmentSchema.extend({
  id: z.string().uuid(),
});

const CancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  cancellationReason: z.string().trim().min(1).max(500),
});

const ChangeStatusSchema = z.object({
  id: z.string().uuid(),
  status: AppointmentStatusSchema,
  internalNotes: z.string().trim().max(2000).optional().nullable(),
});

const AdminSlotsSchema = z.object({
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  excludeAppointmentId: z.string().uuid().optional(),
});

type ActionExtras = { businessId?: string; userId?: string; appointmentId?: string };

export async function listAppointmentsAction(
  input: unknown,
): Promise<
  | { ok: true; appointments: CalendarAppointment[] }
  | { ok: false; error: string }
> {
  try {
    const { membership } = await requireBusinessMember();
    const parsed = ListFiltersSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const filters: AppointmentListFilters = parsed.data;
    const appointments = await listAppointmentsWithDetails(
      membership.businessId,
      filters,
    );
    return { ok: true, appointments };
  } catch (err) {
    if (err instanceof GuardError) return { ok: false, error: err.code };
    return { ok: false, error: "unknown" };
  }
}

export async function listCalendarAvailableSlotsAction(
  input: unknown,
): Promise<
  | { ok: true; slots: CalendarAvailableSlot[] }
  | { ok: false; error: string }
> {
  try {
    const { membership } = await requireBusinessMember();
    const parsed = AvailabilitySlotsSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const slots = await listCalendarAvailableSlots(
      {
        businessId: membership.businessId,
        from: parsed.data.from,
        to: parsed.data.to,
        staffMemberId: parsed.data.staffMemberId,
      },
      { includePast: true },
    );
    return { ok: true, slots };
  } catch (err) {
    if (err instanceof GuardError) return { ok: false, error: err.code };
    return { ok: false, error: "unknown" };
  }
}

export async function getAppointmentByIdAction(
  input: unknown,
): Promise<
  | { ok: true; appointment: CalendarAppointmentDetail }
  | { ok: false; error: string }
> {
  try {
    const { membership } = await requireBusinessMember();
    const parsed = AppointmentIdSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const appointment = await findAppointmentDetailById(
      membership.businessId,
      parsed.data.id,
    );
    if (!appointment) return { ok: false, error: "not_found" };
    return { ok: true, appointment };
  } catch (err) {
    if (err instanceof GuardError) return { ok: false, error: err.code };
    return { ok: false, error: "unknown" };
  }
}

export const createManualAppointmentAction = withAudit(
  (_args, result) => ({
    action: "appointment.create_manual",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "appointment",
    entityId: result.appointmentId ?? null,
  }),
  async (input: unknown): Promise<ActionResult & ActionExtras> => {
    try {
      const { membership, user } = await requireBusinessMember();
      const parsed = ManualAppointmentSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const customer = await findCustomerById(
        membership.businessId,
        parsed.data.customerId,
      );
      if (!customer) return actionError("customer_not_found");

      const startsAt = new Date(parsed.data.startsAt);
      const slot = await validateAppointmentSlot({
        businessId: membership.businessId,
        serviceId: parsed.data.serviceId,
        staffMemberId: parsed.data.staffMemberId,
        startsAt,
      });
      if (!slot.ok) return actionError(slot.reason);

      const appointment = await createAppointment({
        business_id: membership.businessId,
        customer_id: parsed.data.customerId,
        service_id: parsed.data.serviceId,
        staff_member_id: parsed.data.staffMemberId,
        starts_at: startsAt.toISOString(),
        ends_at: slot.endsAt.toISOString(),
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        internal_notes: parsed.data.internalNotes ?? null,
      });

      revalidatePath(CALENDAR_PATH);
      revalidatePath("/dashboard");

      if (parsed.data.status === "pending" || parsed.data.status === "confirmed") {
        scheduleBookingConfirmationSms(appointment.id);
      }

      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        appointmentId: appointment.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      if (err instanceof Error && err.message.includes("slot_unavailable")) {
        return actionError("slot_unavailable");
      }
      return actionError("unknown");
    }
  },
);

export const updateAppointmentAction = withAudit(
  (args, result) => ({
    action: "appointment.update",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "appointment",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & ActionExtras> => {
    try {
      const { membership, user } = await requireBusinessMember();
      const parsed = UpdateAppointmentSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const startsAt = new Date(parsed.data.startsAt);
      const slot = await validateAppointmentSlot({
        businessId: membership.businessId,
        serviceId: parsed.data.serviceId,
        staffMemberId: parsed.data.staffMemberId,
        startsAt,
        excludeAppointmentId: parsed.data.id,
      });
      if (!slot.ok) return actionError(slot.reason);

      await updateAppointment(membership.businessId, parsed.data.id, {
        customer_id: parsed.data.customerId,
        service_id: parsed.data.serviceId,
        staff_member_id: parsed.data.staffMemberId,
        starts_at: startsAt.toISOString(),
        ends_at: slot.endsAt.toISOString(),
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        internal_notes: parsed.data.internalNotes ?? null,
      });

      revalidatePath(CALENDAR_PATH);
      revalidatePath("/dashboard");
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        appointmentId: parsed.data.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      if (err instanceof Error) {
        if (err.message.includes("slot_unavailable")) return actionError("slot_unavailable");
        if (err.message.includes("not found")) return actionError("not_found");
      }
      return actionError("unknown");
    }
  },
);

export const cancelAppointmentAction = withAudit(
  (args, result) => ({
    action: "appointment.cancel",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "appointment",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & ActionExtras> => {
    try {
      const { membership, user } = await requireBusinessMember();
      const parsed = CancelAppointmentSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await changeAppointmentStatus(
        membership.businessId,
        parsed.data.id,
        "cancelled",
        {
          cancellation_reason: parsed.data.cancellationReason,
          cancelled_at: new Date().toISOString(),
        },
      );

      revalidatePath(CALENDAR_PATH);
      revalidatePath("/dashboard/availability");
      revalidatePath("/dashboard");
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        appointmentId: parsed.data.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const changeAppointmentStatusAction = withAudit(
  (args, result) => ({
    action: "appointment.status_change",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "appointment",
    entityId: (args[0] as { id?: string; status?: AppointmentStatus })?.id ?? null,
    metadata: {
      status: (args[0] as { status?: AppointmentStatus })?.status ?? null,
    },
  }),
  async (input: unknown): Promise<ActionResult & ActionExtras> => {
    try {
      const { membership, user } = await requireBusinessMember();
      const parsed = ChangeStatusSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const extra =
        parsed.data.status === "cancelled"
          ? {
              cancelled_at: new Date().toISOString(),
            }
          : {};

      await changeAppointmentStatus(
        membership.businessId,
        parsed.data.id,
        parsed.data.status,
        {
          internal_notes: parsed.data.internalNotes ?? undefined,
          ...extra,
        },
      );

      revalidatePath(CALENDAR_PATH);
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        appointmentId: parsed.data.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export async function getAvailableSlotsForAdminAction(
  input: unknown,
): Promise<{ ok: true; slots: AvailableSlot[] } | { ok: false; error: string }> {
  try {
    const { membership } = await requireBusinessMember();
    const parsed = AdminSlotsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const service = await findServiceById(membership.businessId, parsed.data.serviceId);
    if (!service?.active) return { ok: false, error: "service_not_found" };

    const staff = await findStaffById(
      membership.businessId,
      parsed.data.staffMemberId,
    );
    if (!staff?.active) return { ok: false, error: "staff_not_found" };

    const slots = await getAvailableSlotsForAdmin({
      businessId: membership.businessId,
      serviceId: parsed.data.serviceId,
      staffMemberId: parsed.data.staffMemberId,
      date: parsed.data.date,
      excludeAppointmentId: parsed.data.excludeAppointmentId,
    });

    return { ok: true, slots };
  } catch (err) {
    if (err instanceof GuardError) return { ok: false, error: err.code };
    return { ok: false, error: "unknown" };
  }
}
