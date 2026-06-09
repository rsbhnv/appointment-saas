"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import { validateTimeRanges } from "@/lib/availability/ranges";
import {
  clearConflictingAvailabilityRules,
  createAvailabilityException,
  createAvailabilityRule,
  createSlotOverride,
  deleteAvailabilityException,
  deleteAvailabilityRule,
  deleteSlotOverride,
  replaceDateAvailabilityExceptions,
  updateAvailabilityException,
  updateAvailabilityRule,
} from "@/server/repositories/availability";
import {
  resolveAvailabilityStaffMemberId,
  soleActiveStaffMemberId,
} from "@/server/services/availability-staff-scope.service";
import { withAudit } from "@/server/services/with-audit";

import { actionError, type ActionResult } from "./action-result";

const AVAILABILITY_PATH = "/dashboard/availability";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

async function assertAdmin() {
  return requireBusinessMember({ minimumRole: "business_admin" });
}

const RuleSchema = z.object({
  staff_member_id: z.string().uuid().optional().nullable(),
  day_of_week: z.coerce.number().int().min(1).max(7),
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
  active: z.coerce.boolean().default(true),
});

const UpdateRuleSchema = RuleSchema.extend({ id: z.string().uuid() });
const DeleteIdSchema = z.object({ id: z.string().uuid() });

const ExceptionSchema = z.object({
  staff_member_id: z.string().uuid().optional().nullable(),
  exception_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closed: z.coerce.boolean().default(false),
  start_time: z.string().regex(timeRegex).optional().nullable(),
  end_time: z.string().regex(timeRegex).optional().nullable(),
  reason: z.string().trim().max(500).optional().nullable(),
});

const UpdateExceptionSchema = ExceptionSchema.extend({ id: z.string().uuid() });

const BlockSchema = z.object({
  staff_member_id: z.string().uuid().optional().nullable(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  reason: z.string().trim().max(500).optional().nullable(),
});

const TimeRangeSchema = z.object({
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
});

const SaveDateAvailabilitySchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(62),
  staff_member_id: z.string().uuid().optional().nullable(),
  closed: z.coerce.boolean().default(false),
  ranges: z.array(TimeRangeSchema).default([]),
  reason: z.string().trim().max(500).optional().nullable(),
  /** When true, removes date-specific rows so weekly rules apply again. */
  use_weekly_schedule: z.coerce.boolean().default(false),
});

function revalidateAvailability() {
  revalidatePath(AVAILABILITY_PATH);
  revalidatePath("/dashboard/calendar");
}

export const createAvailabilityRuleAction = withAudit(
  (_args, result) => ({
    action: "availability_rule.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_rule",
    entityId: result.ruleId ?? null,
  }),
  async (
    input: unknown,
  ): Promise<ActionResult & { businessId?: string; userId?: string; ruleId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = RuleSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");
      if (parsed.data.start_time >= parsed.data.end_time) {
        return actionError("invalid_input");
      }

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );
      const singleStaffBusiness = Boolean(
        await soleActiveStaffMemberId(membership.businessId),
      );

      await clearConflictingAvailabilityRules(membership.businessId, {
        dayOfWeek: parsed.data.day_of_week,
        startTime: parsed.data.start_time,
        endTime: parsed.data.end_time,
        staffMemberId,
        singleStaffBusiness,
      });

      const rule = await createAvailabilityRule(membership.businessId, {
        staff_member_id: staffMemberId,
        day_of_week: parsed.data.day_of_week,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        active: parsed.data.active,
      });

      revalidateAvailability();
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        ruleId: rule.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateAvailabilityRuleAction = withAudit(
  (args, result) => ({
    action: "availability_rule.update",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_rule",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = UpdateRuleSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");
      if (parsed.data.start_time >= parsed.data.end_time) {
        return actionError("invalid_input");
      }

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );
      const singleStaffBusiness = Boolean(
        await soleActiveStaffMemberId(membership.businessId),
      );

      await clearConflictingAvailabilityRules(membership.businessId, {
        dayOfWeek: parsed.data.day_of_week,
        startTime: parsed.data.start_time,
        endTime: parsed.data.end_time,
        staffMemberId,
        excludeRuleId: parsed.data.id,
        singleStaffBusiness,
      });

      await updateAvailabilityRule(membership.businessId, parsed.data.id, {
        staff_member_id: staffMemberId,
        day_of_week: parsed.data.day_of_week,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        active: parsed.data.active,
      });

      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const deleteAvailabilityRuleAction = withAudit(
  (args, result) => ({
    action: "availability_rule.delete",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_rule",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = DeleteIdSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await deleteAvailabilityRule(membership.businessId, parsed.data.id);
      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const createAvailabilityExceptionAction = withAudit(
  (_args, result) => ({
    action: "availability_exception.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_exception",
    entityId: result.exceptionId ?? null,
  }),
  async (
    input: unknown,
  ): Promise<
    ActionResult & { businessId?: string; userId?: string; exceptionId?: string }
  > => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = ExceptionSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");
      if (
        !parsed.data.closed &&
        (!parsed.data.start_time || !parsed.data.end_time)
      ) {
        return actionError("invalid_input");
      }
      if (
        parsed.data.start_time &&
        parsed.data.end_time &&
        parsed.data.start_time >= parsed.data.end_time
      ) {
        return actionError("invalid_input");
      }

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );

      const row = await createAvailabilityException(membership.businessId, {
        staff_member_id: staffMemberId,
        exception_date: parsed.data.exception_date,
        closed: parsed.data.closed,
        start_time: parsed.data.closed ? null : parsed.data.start_time ?? null,
        end_time: parsed.data.closed ? null : parsed.data.end_time ?? null,
        reason: parsed.data.reason ?? null,
      });

      revalidateAvailability();
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        exceptionId: row.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateAvailabilityExceptionAction = withAudit(
  (args, result) => ({
    action: "availability_exception.update",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_exception",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = UpdateExceptionSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );

      await updateAvailabilityException(membership.businessId, parsed.data.id, {
        staff_member_id: staffMemberId,
        exception_date: parsed.data.exception_date,
        closed: parsed.data.closed,
        start_time: parsed.data.closed ? null : parsed.data.start_time ?? null,
        end_time: parsed.data.closed ? null : parsed.data.end_time ?? null,
        reason: parsed.data.reason ?? null,
      });

      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const saveDateAvailabilityAction = withAudit(
  (_args, result) => ({
    action: "availability_exception.bulk_save",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_exception",
    entityId: null,
  }),
  async (
    input: unknown,
  ): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = SaveDateAvailabilitySchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );
      const singleStaffBusiness = Boolean(
        await soleActiveStaffMemberId(membership.businessId),
      );
      const replaceOptions = { singleStaffBusiness };

      if (parsed.data.use_weekly_schedule) {
        await replaceDateAvailabilityExceptions(
          membership.businessId,
          parsed.data.dates,
          staffMemberId,
          { closed: false, ranges: [], reason: null },
          replaceOptions,
        );
        revalidateAvailability();
        return { ok: true, businessId: membership.businessId, userId: user.id };
      }

      if (parsed.data.closed) {
        await replaceDateAvailabilityExceptions(
          membership.businessId,
          parsed.data.dates,
          staffMemberId,
          { closed: true, ranges: [], reason: parsed.data.reason ?? null },
          replaceOptions,
        );
        revalidateAvailability();
        return { ok: true, businessId: membership.businessId, userId: user.id };
      }

      const validated = validateTimeRanges(parsed.data.ranges);
      if (!validated.ok) {
        return actionError(
          validated.error === "overlap"
            ? "ranges_overlap"
            : validated.error === "invalid_order"
              ? "invalid_time_order"
              : "empty_ranges",
        );
      }

      await replaceDateAvailabilityExceptions(
        membership.businessId,
        parsed.data.dates,
        staffMemberId,
        {
          closed: false,
          ranges: validated.ranges,
          reason: parsed.data.reason ?? null,
        },
        replaceOptions,
      );

      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const deleteAvailabilityExceptionAction = withAudit(
  (args, result) => ({
    action: "availability_exception.delete",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "availability_exception",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = DeleteIdSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await deleteAvailabilityException(membership.businessId, parsed.data.id);
      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const createSlotBlockAction = withAudit(
  (_args, result) => ({
    action: "slot_override.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "slot_override",
    entityId: result.overrideId ?? null,
  }),
  async (
    input: unknown,
  ): Promise<
    ActionResult & { businessId?: string; userId?: string; overrideId?: string }
  > => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = BlockSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const startsAt = new Date(parsed.data.starts_at);
      const endsAt = new Date(parsed.data.ends_at);
      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(endsAt.getTime()) ||
        startsAt >= endsAt
      ) {
        return actionError("invalid_input");
      }

      const staffMemberId = await resolveAvailabilityStaffMemberId(
        membership.businessId,
        parsed.data.staff_member_id,
      );

      const row = await createSlotOverride(membership.businessId, {
        staff_member_id: staffMemberId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        override_type: "block",
        reason: parsed.data.reason ?? null,
      });

      revalidateAvailability();
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        overrideId: row.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const deleteSlotBlockAction = withAudit(
  (args, result) => ({
    action: "slot_override.delete",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "slot_override",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = DeleteIdSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await deleteSlotOverride(membership.businessId, parsed.data.id);
      revalidateAvailability();
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);
