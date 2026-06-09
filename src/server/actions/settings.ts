"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import { upsertSettings } from "@/server/repositories/app-settings";
import { updateBusiness } from "@/server/repositories/businesses";
import { withAudit } from "@/server/services/with-audit";
import { BUSINESS_THEME_STYLES } from "@/lib/theme/types";
import { normalizeHex } from "@/lib/theme/color-utils";

import { actionError, type ActionResult } from "./action-result";

const HEX_COLOR = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "invalid_hex")
  .optional()
  .nullable()
  .or(z.literal(""));

const BusinessThemeSchema = z.object({
  theme_style: z
    .enum(BUSINESS_THEME_STYLES)
    .optional()
    .nullable()
    .or(z.literal("")),
  primary_color: HEX_COLOR,
  secondary_color: HEX_COLOR,
});

const BusinessProfileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable().or(z.literal("")),
  description: z.string().trim().max(2000).optional().nullable(),
  timezone: z.string().trim().min(1).max(64).default("Asia/Jerusalem"),
  address: z.string().trim().max(500).optional().nullable(),
  arrival_instructions: z.string().trim().max(1000).optional().nullable(),
  payment_methods: z.string().trim().max(1000).optional().nullable(),
});

const BookingSettingsSchema = z.object({
  booking_window_days: z.coerce.number().int().min(1).max(365),
  min_hours_before_booking: z.coerce.number().int().min(0),
  max_appointments_per_customer_per_day: z.coerce.number().int().min(1),
  max_appointments_per_customer_per_week: z.coerce.number().int().min(1),
  max_appointments_per_customer_per_month: z.coerce.number().int().min(1),
  limit_one_booking_per_day: z.coerce.boolean(),
  limit_one_booking_per_week: z.coerce.boolean(),
  limit_one_booking_per_month: z.coerce.boolean(),
  allow_customer_cancellation: z.coerce.boolean(),
  cancellation_min_hours: z.coerce.number().int().min(0),
  default_slot_duration_minutes: z.coerce.number().int().min(5).max(480),
  break_between_appointments_minutes: z.coerce.number().int().min(0).max(240),
  confirmation_message: z.string().trim().max(2000).optional().nullable(),
});

async function assertOwner() {
  return requireBusinessMember({ minimumRole: "business_owner" });
}

export const updateBusinessProfileAction = withAudit(
  (_args, result) => ({
    action: "business.update_profile",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "business",
    entityId: result.businessId,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertOwner();
      const parsed = BusinessProfileSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const updated = await updateBusiness(membership.businessId, {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        description: parsed.data.description || null,
        timezone: parsed.data.timezone,
        address: parsed.data.address || null,
        arrival_instructions: parsed.data.arrival_instructions || null,
        payment_methods: parsed.data.payment_methods || null,
      });

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      revalidatePath(`/${updated.slug}/book`);
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateBusinessThemeAction = withAudit(
  (_args, result) => ({
    action: "business.update_theme",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "business",
    entityId: result.businessId,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertOwner();
      const parsed = BusinessThemeSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const primary = parsed.data.primary_color
        ? normalizeHex(parsed.data.primary_color)
        : null;
      const secondary = parsed.data.secondary_color
        ? normalizeHex(parsed.data.secondary_color)
        : null;
      if (parsed.data.primary_color && !primary) return actionError("invalid_input");
      if (parsed.data.secondary_color && !secondary) return actionError("invalid_input");

      const themeStyle = parsed.data.theme_style || null;

      const updated = await updateBusiness(membership.businessId, {
        theme_style: themeStyle,
        primary_color: primary,
        secondary_color: secondary,
      });

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      revalidatePath(`/${updated.slug}/book`);
      revalidatePath(`/${updated.slug}/my-appointments`);
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateBookingSettingsAction = withAudit(
  (_args, result) => ({
    action: "settings.update_booking",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "app_settings",
    entityId: result.businessId,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertOwner();
      const parsed = BookingSettingsSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await upsertSettings(membership.businessId, {
        booking_window_days: parsed.data.booking_window_days,
        min_hours_before_booking: parsed.data.min_hours_before_booking,
        max_appointments_per_customer_per_day:
          parsed.data.max_appointments_per_customer_per_day,
        max_appointments_per_customer_per_week:
          parsed.data.max_appointments_per_customer_per_week,
        max_appointments_per_customer_per_month:
          parsed.data.max_appointments_per_customer_per_month,
        limit_one_booking_per_day: parsed.data.limit_one_booking_per_day,
        limit_one_booking_per_week: parsed.data.limit_one_booking_per_week,
        limit_one_booking_per_month: parsed.data.limit_one_booking_per_month,
        allow_customer_cancellation: parsed.data.allow_customer_cancellation,
        cancellation_min_hours: parsed.data.cancellation_min_hours,
        default_slot_duration_minutes: parsed.data.default_slot_duration_minutes,
        break_between_appointments_minutes:
          parsed.data.break_between_appointments_minutes,
        confirmation_message: parsed.data.confirmation_message || null,
      });

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard/calendar");
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (
          message.includes("limit_one_booking") ||
          message.includes("max_appointments_per_customer_per_week") ||
          message.includes("max_appointments_per_customer_per_month") ||
          message.includes("schema cache") ||
          message.includes("does not exist")
        ) {
          return actionError("schema_outdated");
        }
      }
      return actionError("unknown");
    }
  },
);
