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

/**
 * Date-specific exceptions override weekly rules for that calendar day.
 * Multiple exception rows on the same date define multiple working windows.
 * A "closed" row on the date blocks the entire day.
 */
export function resolveDayWorkingWindows(
  input: ResolveDayWindowsInput,
): WorkingHoursWindow[] {
  const timeZone = input.timeZone ?? DEFAULT_CALENDAR_TIMEZONE;
  const dayExceptions = input.exceptions.filter(
    (row) =>
      row.exception_date === input.dateInput &&
      (row.staff_member_id === null ||
        input.staffMemberIds.has(row.staff_member_id)),
  );

  if (dayExceptions.some((row) => row.closed)) {
    return [];
  }

  const openRanges = dayExceptions.filter(
    (row) => row.start_time && row.end_time,
  );
  if (openRanges.length > 0) {
    return openRanges
      .map((row) => ({
        startMinutes: parseTimeToMinutes(row.start_time!),
        endMinutes: parseTimeToMinutes(row.end_time!),
      }))
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }

  const dayOfWeek = getIsoDayOfWeekForDateInput(input.dateInput, timeZone);
  const ruleWindows = workingWindowsFromRules(
    input.rules,
    dayOfWeek,
    input.staffMemberIds,
  );
  return ruleWindows.length > 0 ? ruleWindows : DEFAULT_WINDOWS;
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
