import "server-only";

import { parseTimeToMinutes } from "@/lib/availability/ranges";
import {
  DEFAULT_CALENDAR_TIMEZONE,
  getIsoDayOfWeekForDateInput,
} from "@/lib/calendar/timezone";
import type { WorkingHoursWindow } from "@/lib/calendar/types";
import type {
  AvailabilityException,
  AvailabilityRule,
} from "@/server/repositories/availability";

const DEFAULT_WINDOWS: WorkingHoursWindow[] = [
  { startMinutes: 9 * 60, endMinutes: 20 * 60 },
];

export function workingWindowsFromRules(
  rules: AvailabilityRule[],
  dayOfWeek: number,
  staffMemberIds: Set<string>,
): WorkingHoursWindow[] {
  return rules
    .filter(
      (rule) =>
        rule.day_of_week === dayOfWeek &&
        rule.active &&
        (rule.staff_member_id === null ||
          staffMemberIds.has(rule.staff_member_id)),
    )
    .map((rule) => ({
      startMinutes: parseTimeToMinutes(rule.start_time),
      endMinutes: parseTimeToMinutes(rule.end_time),
    }));
}

export type ResolveDayWindowsInput = {
  dateInput: string;
  timeZone?: string;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  staffMemberIds: Set<string>;
};

function mapOpenExceptionRows(
  rows: AvailabilityException[],
): WorkingHoursWindow[] {
  return rows
    .map((row) => ({
      startMinutes: parseTimeToMinutes(row.start_time!),
      endMinutes: parseTimeToMinutes(row.end_time!),
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

/**
 * Resolves working windows for one staff member on a calendar day.
 * Staff-specific open ranges override a global "closed" row on the same date.
 */
export function resolveDayWorkingWindowsForStaff(
  input: Omit<ResolveDayWindowsInput, "staffMemberIds"> & {
    staffMemberId: string;
  },
): WorkingHoursWindow[] {
  const timeZone = input.timeZone ?? DEFAULT_CALENDAR_TIMEZONE;
  const dayExceptions = input.exceptions.filter(
    (row) =>
      row.exception_date === input.dateInput &&
      (row.staff_member_id === null ||
        row.staff_member_id === input.staffMemberId),
  );

  const staffSpecificOpen = dayExceptions.filter(
    (row) =>
      !row.closed &&
      row.staff_member_id === input.staffMemberId &&
      row.start_time &&
      row.end_time,
  );
  const globalOpen = dayExceptions.filter(
    (row) =>
      !row.closed &&
      row.staff_member_id === null &&
      row.start_time &&
      row.end_time,
  );
  const openRows =
    staffSpecificOpen.length > 0 ? staffSpecificOpen : globalOpen;

  if (openRows.length > 0) {
    return mapOpenExceptionRows(openRows);
  }

  if (
    dayExceptions.some(
      (row) => row.closed && row.staff_member_id === input.staffMemberId,
    )
  ) {
    return [];
  }

  if (
    dayExceptions.some((row) => row.closed && row.staff_member_id === null)
  ) {
    return [];
  }

  const dayOfWeek = getIsoDayOfWeekForDateInput(input.dateInput, timeZone);
  const ruleWindows = workingWindowsFromRules(
    input.rules,
    dayOfWeek,
    new Set([input.staffMemberId]),
  );
  return ruleWindows.length > 0 ? ruleWindows : DEFAULT_WINDOWS;
}

/**
 * Date-specific exceptions override weekly rules for that calendar day.
 * When multiple staff ids are supplied, windows for each staff member are merged.
 */
export function resolveDayWorkingWindows(
  input: ResolveDayWindowsInput,
): WorkingHoursWindow[] {
  if (input.staffMemberIds.size === 1) {
    const staffMemberId = [...input.staffMemberIds][0]!;
    return resolveDayWorkingWindowsForStaff({
      ...input,
      staffMemberId,
    });
  }

  const merged: WorkingHoursWindow[] = [];
  for (const staffMemberId of input.staffMemberIds) {
    merged.push(
      ...resolveDayWorkingWindowsForStaff({
        ...input,
        staffMemberId,
      }),
    );
  }

  return merged.sort((a, b) => a.startMinutes - b.startMinutes);
}

export function exceptionsByDate(
  exceptions: AvailabilityException[],
  staffMemberIds: Set<string>,
): Map<string, AvailabilityException[]> {
  const map = new Map<string, AvailabilityException[]>();
  for (const row of exceptions) {
    if (row.staff_member_id && !staffMemberIds.has(row.staff_member_id)) {
      continue;
    }
    const list = map.get(row.exception_date) ?? [];
    list.push(row);
    map.set(row.exception_date, list);
  }
  return map;
}
