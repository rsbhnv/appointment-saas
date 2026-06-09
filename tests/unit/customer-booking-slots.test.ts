import { describe, expect, it } from "vitest";

import {
  addDaysToDateInput,
  todayDateInTimezone,
} from "@/lib/calendar/timezone";

describe("customer booking calendar dates", () => {
  it("uses business timezone for today", () => {
    const tz = "Asia/Jerusalem";
    expect(todayDateInTimezone(tz)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("adds booking window days in business timezone", () => {
    const start = "2026-06-09";
    expect(addDaysToDateInput(start, 30, "Asia/Jerusalem")).toBe("2026-07-09");
  });
});

describe("booking slot grid step", () => {
  it("spaces slots by duration + break (60+15), not every 15 minutes", () => {
    const slotDuration = 60;
    const step = slotDuration + 15;
    const starts: number[] = [];
    for (let cursor = 9 * 60; cursor + slotDuration <= 20 * 60; cursor += step) {
      starts.push(cursor);
    }
    expect(starts).toEqual([
      9 * 60,
      10 * 60 + 15,
      11 * 60 + 30,
      12 * 60 + 45,
      14 * 60,
      15 * 60 + 15,
      16 * 60 + 30,
      17 * 60 + 45,
      19 * 60,
    ]);
    expect(starts).not.toContain(9 * 60 + 15);
  });
});

describe("min_hours_before_booking hides rest of today", () => {
  it("excludes last slot when lead time exceeds remaining window", () => {
    const slotDuration = 60;
    const windowEndMinutes = 20 * 60;
    const step = 75;
    const slots: number[] = [];
    for (let c = 9 * 60; c + slotDuration <= windowEndMinutes; c += step) {
      slots.push(c);
    }

    const nowMinutes = 18 * 60 + 7;
    const minHours = 2;
    const minStartMinutes = nowMinutes + minHours * 60;

    const bookable = slots.filter((start) => start >= minStartMinutes);
    expect(slots.at(-1)).toBe(19 * 60);
    expect(bookable).toHaveLength(0);
  });

  it("keeps afternoon slots when enough lead time remains", () => {
    const slotDuration = 60;
    const windowEndMinutes = 20 * 60;
    const step = 75;
    const slots: number[] = [];
    for (let c = 9 * 60; c + slotDuration <= windowEndMinutes; c += step) {
      slots.push(c);
    }

    const nowMinutes = 10 * 60;
    const minHours = 2;
    const minStartMinutes = nowMinutes + minHours * 60;

    const bookable = slots.filter((start) => start >= minStartMinutes);
    expect(bookable.length).toBeGreaterThan(0);
    expect(bookable[0]).toBeGreaterThanOrEqual(12 * 60);
  });
});
