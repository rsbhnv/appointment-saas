import "server-only";

import { parseTimeToMinutes } from "@/lib/availability/ranges";
import {
  DEFAULT_CALENDAR_TIMEZONE,
  wallClockMinutesFromIso,
  wallClockToUtcDate,
} from "@/lib/calendar/timezone";
import {
  addDays,
  parseCalendarDateBound,
  rangesOverlap,
  startOfDay,
  toDateInputValue,
} from "@/lib/calendar/utils";
import { findBusinessById } from "@/server/repositories/businesses";
import type {
  AvailableSlot,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import {
  resolveDayWorkingWindowsForStaff,
} from "@/server/services/availability-windows.service";
import {
  listAvailabilityExceptionsForSlotEngine,
  listAvailabilityRulesForSlotEngine,
  listOccupiedAppointmentsForStaffInRange,
  listOccupiedAppointmentsInRange,
  listSlotOverridesForSlotEngine,
} from "@/server/repositories/slot-engine";
import {
  findServiceById,
} from "@/server/repositories/services";
import {
  findStaffById,
  listStaffByBusinessId,
} from "@/server/repositories/staff-members";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import type { SlotOverride } from "@/server/repositories/availability";

const SLOT_STEP_MINUTES = 15;

async function resolveWorkingWindows(
  businessId: string,
  staffMemberId: string,
  dateInput: string,
  timeZone: string,
) {
  const [rules, exceptions] = await Promise.all([
    listAvailabilityRulesForSlotEngine(businessId),
    listAvailabilityExceptionsForSlotEngine(businessId),
  ]);

  return resolveDayWorkingWindowsForStaff({
    dateInput,
    timeZone,
    rules,
    exceptions,
    staffMemberId,
  });
}

function isBlockedByOverride(
  slotStart: Date,
  slotEnd: Date,
  overrides: SlotOverride[],
  staffMemberId: string,
): boolean {
  return overrides.some((override) => {
    if (override.override_type !== "block") return false;
    if (override.staff_member_id && override.staff_member_id !== staffMemberId) {
      return false;
    }
    const blockStart = new Date(override.starts_at);
    const blockEnd = new Date(override.ends_at);
    return rangesOverlap(slotStart, slotEnd, blockStart, blockEnd);
  });
}

export type ValidateSlotInput = {
  businessId: string;
  serviceId: string;
  staffMemberId: string;
  startsAt: Date;
  excludeAppointmentId?: string;
};

export type ValidateSlotResult =
  | { ok: true; endsAt: Date }
  | { ok: false; reason: "invalid_time" | "service_not_found" | "staff_not_found" | "slot_unavailable" };

export async function validateAppointmentSlot(
  input: ValidateSlotInput,
): Promise<ValidateSlotResult> {
  const service = await findServiceById(input.businessId, input.serviceId);
  if (!service?.active) return { ok: false, reason: "service_not_found" };

  const staff = await findStaffById(input.businessId, input.staffMemberId);
  if (!staff?.active) return { ok: false, reason: "staff_not_found" };

  if (Number.isNaN(input.startsAt.getTime())) {
    return { ok: false, reason: "invalid_time" };
  }

  const endsAt = new Date(
    input.startsAt.getTime() + service.duration_minutes * 60_000,
  );

  const business = await findBusinessById(input.businessId);
  const timeZone = business?.timezone ?? DEFAULT_CALENDAR_TIMEZONE;
  const dateInput = new Intl.DateTimeFormat("en-CA", { timeZone }).format(
    input.startsAt,
  );
  const dayStart = wallClockToUtcDate(dateInput, 0, timeZone);
  const dayEnd = wallClockToUtcDate(dateInput, 24 * 60 - 1, timeZone);

  const windows = await resolveWorkingWindows(
    input.businessId,
    input.staffMemberId,
    dateInput,
    timeZone,
  );

  const startMinutes = wallClockMinutesFromIso(
    input.startsAt.toISOString(),
    timeZone,
  );
  const endMinutes = wallClockMinutesFromIso(endsAt.toISOString(), timeZone);
  const withinHours = windows.some(
    (window) => startMinutes >= window.startMinutes && endMinutes <= window.endMinutes,
  );
  if (!withinHours) return { ok: false, reason: "slot_unavailable" };

  const overrides = await listSlotOverridesForSlotEngine(input.businessId);
  if (
    isBlockedByOverride(input.startsAt, endsAt, overrides, input.staffMemberId)
  ) {
    return { ok: false, reason: "slot_unavailable" };
  }

  const existing = await listOccupiedAppointmentsForStaffInRange(
    input.businessId,
    input.staffMemberId,
    dayStart.toISOString(),
    dayEnd.toISOString(),
    input.excludeAppointmentId,
  );

  const overlaps = existing.some((row) =>
    rangesOverlap(
      input.startsAt,
      endsAt,
      new Date(row.starts_at),
      new Date(row.ends_at),
    ),
  );
  if (overlaps) return { ok: false, reason: "slot_unavailable" };

  return { ok: true, endsAt };
}

export type AdminSlotsQuery = {
  businessId: string;
  serviceId: string;
  staffMemberId: string;
  date: string;
  excludeAppointmentId?: string;
};

export type SlotBookingConstraints = {
  /** Minimum hours from now before a slot can be booked. */
  minHoursBefore?: number;
  /** Last calendar day (inclusive) customers may book, as YYYY-MM-DD. */
  maxBookingDate?: string;
  /** Owner/admin booking may include slots that already started today. */
  includePast?: boolean;
};

export type CalendarSlotsQuery = {
  businessId: string;
  from: string;
  to: string;
  staffMemberId?: string;
  excludeAppointmentId?: string;
};

export type CalendarSlotsOptions = {
  includePast?: boolean;
};

export async function getAvailableSlots(
  query: AdminSlotsQuery,
  constraints: SlotBookingConstraints = {},
): Promise<AvailableSlot[]> {
  const service = await findServiceById(query.businessId, query.serviceId);
  if (!service?.active) return [];

  const staff = await findStaffById(query.businessId, query.staffMemberId);
  if (!staff?.active) return [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) return [];

  if (constraints.maxBookingDate && query.date > constraints.maxBookingDate) {
    return [];
  }

  const business = await findBusinessById(query.businessId);
  const timeZone = business?.timezone ?? DEFAULT_CALENDAR_TIMEZONE;

  const windows = await resolveWorkingWindows(
    query.businessId,
    query.staffMemberId,
    query.date,
    timeZone,
  );
  if (windows.length === 0) return [];

  const dayStart = wallClockToUtcDate(query.date, 0, timeZone);
  const dayEnd = wallClockToUtcDate(query.date, 24 * 60 - 1, timeZone);

  const [existing, overrides] = await Promise.all([
    listOccupiedAppointmentsForStaffInRange(
      query.businessId,
      query.staffMemberId,
      dayStart.toISOString(),
      dayEnd.toISOString(),
      query.excludeAppointmentId,
    ),
    listSlotOverridesForSlotEngine(query.businessId),
  ]);

  const slots: AvailableSlot[] = [];
  const minHours = constraints.minHoursBefore ?? 0;
  const minStartMs = Date.now() + minHours * 3_600_000;

  for (const window of windows) {
    for (
      let cursor = window.startMinutes;
      cursor + service.duration_minutes <= window.endMinutes;
      cursor += SLOT_STEP_MINUTES
    ) {
      const startsAt = wallClockToUtcDate(query.date, cursor, timeZone);
      const endsAt = new Date(
        startsAt.getTime() + service.duration_minutes * 60_000,
      );

      if (!constraints.includePast && startsAt.getTime() < minStartMs) continue;

      if (
        isBlockedByOverride(startsAt, endsAt, overrides, query.staffMemberId)
      ) {
        continue;
      }

      const overlaps = existing.some((row) =>
        rangesOverlap(
          startsAt,
          endsAt,
          new Date(row.starts_at),
          new Date(row.ends_at),
        ),
      );
      if (overlaps) continue;

      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    }
  }

  return slots;
}

export async function listCalendarAvailableSlots(
  query: CalendarSlotsQuery,
  options: CalendarSlotsOptions = {},
): Promise<CalendarAvailableSlot[]> {
  const fromDate = parseCalendarDateBound(query.from);
  const toDate = parseCalendarDateBound(query.to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return [];
  }

  const rangeEnd = new Date(toDate);
  rangeEnd.setHours(23, 59, 59, 999);

  const [business, settings, staff, rules, exceptions, overrides, existing] =
    await Promise.all([
      findBusinessById(query.businessId),
      findSettingsByBusinessId(query.businessId),
      listStaffByBusinessId(query.businessId),
      listAvailabilityRulesForSlotEngine(query.businessId),
      listAvailabilityExceptionsForSlotEngine(query.businessId),
      listSlotOverridesForSlotEngine(query.businessId),
      listOccupiedAppointmentsInRange(
        query.businessId,
        fromDate.toISOString(),
        rangeEnd.toISOString(),
      ),
    ]);

  const timeZone = business?.timezone ?? DEFAULT_CALENDAR_TIMEZONE;

  const activeStaff = staff.filter(
    (member) => member.active && (!query.staffMemberId || member.id === query.staffMemberId),
  );
  if (activeStaff.length === 0) return [];

  const slotDuration = settings?.default_slot_duration_minutes ?? 60;
  const breakMinutes = settings?.break_between_appointments_minutes ?? 15;
  const slotStepMinutes = slotDuration + breakMinutes;

  const dates: string[] = [];
  for (let day = fromDate; day <= toDate; day = addDays(day, 1)) {
    dates.push(toDateInputValue(day));
  }

  const slotGroups = dates.flatMap((date) => {
    const dayStart = wallClockToUtcDate(date, 0, timeZone);
    const dayEnd = wallClockToUtcDate(date, 24 * 60 - 1, timeZone);

    const dayAppointments = existing.filter((row) =>
      rangesOverlap(
        dayStart,
        dayEnd,
        new Date(row.starts_at),
        new Date(row.ends_at),
      ),
    );

    return activeStaff.flatMap((staffMember) => {
      const windows = resolveDayWorkingWindowsForStaff({
        dateInput: date,
        timeZone,
        rules,
        exceptions,
        staffMemberId: staffMember.id,
      });

      const daySlots: CalendarAvailableSlot[] = [];
      for (const window of windows) {
        for (
          let cursor = window.startMinutes;
          cursor + slotDuration <= window.endMinutes;
          cursor += slotStepMinutes
        ) {
          const startsAt = wallClockToUtcDate(date, cursor, timeZone);
          const endsAt = new Date(startsAt.getTime() + slotDuration * 60_000);

          if (!options.includePast && startsAt.getTime() < Date.now()) continue;
          if (
            isBlockedByOverride(startsAt, endsAt, overrides, staffMember.id)
          ) {
            continue;
          }

          const overlapsAppointment = dayAppointments.some(
            (row) =>
              row.staff_member_id === staffMember.id &&
              row.id !== query.excludeAppointmentId &&
              rangesOverlap(
                startsAt,
                endsAt,
                new Date(row.starts_at),
                new Date(row.ends_at),
              ),
          );
          if (overlapsAppointment) continue;

          daySlots.push({
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            date,
            staffMemberId: staffMember.id,
            staffName: staffMember.name,
          });
        }
      }
      return daySlots;
    });
  });

  return dedupeCalendarSlots(
    slotGroups.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  );
}

function dedupeCalendarSlots(
  slots: CalendarAvailableSlot[],
): CalendarAvailableSlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.staffMemberId ?? ""}|${slot.startsAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Admin booking slots — aligned with the calendar grid, includes past times today.
 */
export async function getAvailableSlotsForAdmin(
  query: AdminSlotsQuery,
): Promise<AvailableSlot[]> {
  const service = await findServiceById(query.businessId, query.serviceId);
  if (!service?.active) return [];

  const staff = await findStaffById(query.businessId, query.staffMemberId);
  if (!staff?.active) return [];

  const business = await findBusinessById(query.businessId);
  const timeZone = business?.timezone ?? DEFAULT_CALENDAR_TIMEZONE;
  const dayStart = wallClockToUtcDate(query.date, 0, timeZone);
  const dayEnd = wallClockToUtcDate(query.date, 24 * 60 - 1, timeZone);

  const calendarSlots = await listCalendarAvailableSlots(
    {
      businessId: query.businessId,
      from: dayStart.toISOString(),
      to: dayEnd.toISOString(),
      staffMemberId: query.staffMemberId,
      excludeAppointmentId: query.excludeAppointmentId,
    },
    { includePast: true },
  );

  const daySlots = calendarSlots.filter((row) => row.date === query.date);
  const seenStarts = new Set<string>();
  return daySlots
    .filter((slot) => {
      const spanMinutes =
        (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) /
        60_000;
      return spanMinutes >= service.duration_minutes;
    })
    .map((slot) => ({
      startsAt: slot.startsAt,
      endsAt: new Date(
        new Date(slot.startsAt).getTime() + service.duration_minutes * 60_000,
      ).toISOString(),
    }))
    .filter((slot) => {
      if (seenStarts.has(slot.startsAt)) return false;
      seenStarts.add(slot.startsAt);
      return true;
    });
}

/** Customer booking — aligned with the admin calendar grid, respects booking constraints. */
export async function getAvailableSlotsForCustomer(
  query: AdminSlotsQuery,
  constraints: SlotBookingConstraints = {},
): Promise<AvailableSlot[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) return [];
  if (constraints.maxBookingDate && query.date > constraints.maxBookingDate) {
    return [];
  }

  const slots = await getAvailableSlotsForAdmin(query);
  const minHours = constraints.minHoursBefore ?? 0;
  const minStartMs = Date.now() + minHours * 3_600_000;

  return slots.filter((slot) => new Date(slot.startsAt).getTime() >= minStartMs);
}

/** Dates in range that have at least one bookable slot for the customer. */
export async function getCustomerBookingDatesWithSlots(
  query: AdminSlotsQuery & { from: string; to: string },
  constraints: SlotBookingConstraints = {},
): Promise<string[]> {
  const service = await findServiceById(query.businessId, query.serviceId);
  if (!service?.active) return [];

  const staff = await findStaffById(query.businessId, query.staffMemberId);
  if (!staff?.active) return [];

  const calendarSlots = await listCalendarAvailableSlots(
    {
      businessId: query.businessId,
      from: query.from,
      to: query.to,
      staffMemberId: query.staffMemberId,
    },
    { includePast: false },
  );

  const minHours = constraints.minHoursBefore ?? 0;
  const minStartMs = Date.now() + minHours * 3_600_000;
  const maxDate = constraints.maxBookingDate;

  const dates = new Set<string>();
  for (const slot of calendarSlots) {
    if (maxDate && slot.date > maxDate) continue;
    if (new Date(slot.startsAt).getTime() < minStartMs) continue;
    const spanMinutes =
      (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60_000;
    if (spanMinutes >= service.duration_minutes) {
      dates.add(slot.date);
    }
  }
  return [...dates].sort();
}

export function maxBookingDateString(bookingWindowDays: number): string {
  const end = new Date();
  end.setDate(end.getDate() + bookingWindowDays);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const d = String(end.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
