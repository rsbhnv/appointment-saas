import "server-only";

import {
  addDaysToDateInput,
  DEFAULT_CALENDAR_TIMEZONE,
  startOfWeekDateInput,
  todayDateInTimezone,
  utcBoundsForDateInputRange,
} from "@/lib/calendar/timezone";
import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export type DashboardStats = {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  customerCount: number;
  activeStaffCount: number;
};

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
];

async function countRows(
  table: "appointments" | "customers" | "staff_members",
  businessId: string,
  filters?: {
    gte?: { column: string; value: string };
    lt?: { column: string; value: string };
    eq?: { column: string; value: boolean };
    statusIn?: AppointmentStatus[];
  },
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (filters?.gte) {
    query = query.gte(filters.gte.column, filters.gte.value);
  }
  if (filters?.lt) {
    query = query.lt(filters.lt.column, filters.lt.value);
  }
  if (filters?.eq) {
    query = query.eq(filters.eq.column, filters.eq.value);
  }
  if (filters?.statusIn) {
    query = query.in("status", filters.statusIn);
  }

  const { count, error } = await query;
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

export async function getDashboardStats(
  businessId: string,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): Promise<DashboardStats> {
  if (isDemoMode) {
    const { demoStaffStore } = await import("@/lib/demo/staff-store");
    const activeStaffCount = demoStaffStore
      .list(businessId)
      .filter((row) => row.active).length;
    return {
      appointmentsToday: 3,
      appointmentsThisWeek: 12,
      customerCount: 48,
      activeStaffCount,
    };
  }

  const today = todayDateInTimezone(timeZone);
  const tomorrow = addDaysToDateInput(today, 1, timeZone);
  const weekStart = startOfWeekDateInput(today, timeZone);
  const nextWeekStart = addDaysToDateInput(weekStart, 7, timeZone);

  const todayBounds = utcBoundsForDateInputRange(today, tomorrow, timeZone);
  const weekBounds = utcBoundsForDateInputRange(weekStart, nextWeekStart, timeZone);

  const [
    appointmentsToday,
    appointmentsThisWeek,
    customerCount,
    activeStaffCount,
  ] = await Promise.all([
    countRows("appointments", businessId, {
      gte: { column: "starts_at", value: todayBounds.gte },
      lt: { column: "starts_at", value: todayBounds.lt },
      statusIn: ACTIVE_APPOINTMENT_STATUSES,
    }),
    countRows("appointments", businessId, {
      gte: { column: "starts_at", value: weekBounds.gte },
      lt: { column: "starts_at", value: weekBounds.lt },
      statusIn: ACTIVE_APPOINTMENT_STATUSES,
    }),
    countRows("customers", businessId),
    countRows("staff_members", businessId, {
      eq: { column: "active", value: true },
    }),
  ]);

  return {
    appointmentsToday,
    appointmentsThisWeek,
    customerCount,
    activeStaffCount,
  };
}
