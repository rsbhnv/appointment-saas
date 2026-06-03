import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardStats = {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  customerCount: number;
  activeStaffCount: number;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - diff);
  return day;
}

async function countRows(
  table: "appointments" | "customers" | "staff_members",
  businessId: string,
  filters?: { gte?: { column: string; value: string }; lt?: { column: string; value: string }; eq?: { column: string; value: boolean } },
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

  const { count, error } = await query;
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

export async function getDashboardStats(
  businessId: string,
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

  const now = new Date();
  const todayStart = startOfUtcDay(now).toISOString();
  const tomorrowStart = new Date(startOfUtcDay(now));
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const weekStart = startOfUtcWeek(now).toISOString();
  const nextWeekStart = new Date(startOfUtcWeek(now));
  nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);

  const [
    appointmentsToday,
    appointmentsThisWeek,
    customerCount,
    activeStaffCount,
  ] = await Promise.all([
    countRows("appointments", businessId, {
      gte: { column: "starts_at", value: todayStart },
      lt: { column: "starts_at", value: tomorrowStart.toISOString() },
    }),
    countRows("appointments", businessId, {
      gte: { column: "starts_at", value: weekStart },
      lt: { column: "starts_at", value: nextWeekStart.toISOString() },
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
