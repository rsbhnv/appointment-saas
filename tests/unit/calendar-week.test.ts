import { describe, expect, it } from "vitest";

import {
  getCalendarWeekdayIndex,
  HEBREW_WEEKDAY_HEADERS,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
  weekdayColumnInMonthGrid,
} from "@/lib/calendar/utils";

describe("calendar week alignment (Sunday-first, Hebrew RTL headers)", () => {
  const june2026 = new Date(2026, 5, 1);
  const tuesdayJune9 = new Date(2026, 5, 9);

  it("starts the week on Sunday", () => {
    const sunday = startOfWeek(tuesdayJune9);
    expect(sunday.getDay()).toBe(0);
    expect(toDateInputValue(sunday)).toBe("2026-06-07");
  });

  it("starts the month grid on the Sunday before or on the 1st", () => {
    expect(toDateInputValue(startOfWeek(startOfMonth(june2026)))).toBe(
      "2026-05-31",
    );
  });

  it("places 2026-06-09 (Tuesday) in the Tuesday column", () => {
    expect(getCalendarWeekdayIndex(tuesdayJune9)).toBe(2);
    expect(weekdayColumnInMonthGrid(tuesdayJune9, june2026)).toBe(2);
    expect(HEBREW_WEEKDAY_HEADERS[2]).toBe("ג׳");
  });

  it("aligns June 1 2026 (Monday) under Monday header", () => {
    const mondayJune1 = new Date(2026, 5, 1);
    expect(getCalendarWeekdayIndex(mondayJune1)).toBe(1);
    expect(weekdayColumnInMonthGrid(mondayJune1, june2026)).toBe(1);
    expect(HEBREW_WEEKDAY_HEADERS[1]).toBe("ב׳");
  });

  it("keeps weekday index matching column for every day in June 2026 grid", () => {
    const gridStart = startOfWeek(startOfMonth(june2026));
    for (let i = 0; i < 42; i++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      expect(weekdayColumnInMonthGrid(day, june2026)).toBe(
        getCalendarWeekdayIndex(day),
      );
    }
  });
});
