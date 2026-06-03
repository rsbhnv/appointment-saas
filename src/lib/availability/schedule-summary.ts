import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import { DEFAULT_CALENDAR_TIMEZONE } from "@/lib/calendar/timezone";

const ACTIVE_STATUSES = new Set<CalendarAppointment["status"]>([
  "pending",
  "confirmed",
]);

export function appointmentDateKey(
  startsAt: string,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(startsAt));
}

export function countAppointmentsByDate(
  appointments: CalendarAppointment[],
  staffMemberId: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of appointments) {
    if (!ACTIVE_STATUSES.has(row.status)) continue;
    if (staffMemberId && row.staff.id !== staffMemberId) continue;
    const date = appointmentDateKey(row.startsAt);
    counts[date] = (counts[date] ?? 0) + 1;
  }
  return counts;
}

export function countSlotsByDate(
  slots: CalendarAvailableSlot[],
  staffMemberId: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of slots) {
    if (staffMemberId && row.staffMemberId !== staffMemberId) continue;
    counts[row.date] = (counts[row.date] ?? 0) + 1;
  }
  return counts;
}
