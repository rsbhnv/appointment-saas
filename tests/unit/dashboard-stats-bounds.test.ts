import { describe, expect, it } from "vitest";

import {
  addDaysToDateInput,
  startOfWeekDateInput,
  todayDateInTimezone,
  utcBoundsForDateInputRange,
} from "@/lib/calendar/timezone";

describe("dashboard week bounds", () => {
  it("uses Sunday-start week in Asia/Jerusalem", () => {
    const tz = "Asia/Jerusalem";
    const weekStart = startOfWeekDateInput("2026-06-04", tz);
    expect(weekStart).toBe("2026-05-31");
  });

  it("computes non-overlapping today bounds", () => {
    const tz = "Asia/Jerusalem";
    const today = todayDateInTimezone(tz);
    const tomorrow = addDaysToDateInput(today, 1, tz);
    const bounds = utcBoundsForDateInputRange(today, tomorrow, tz);
    expect(bounds.gte < bounds.lt).toBe(true);
  });
});
