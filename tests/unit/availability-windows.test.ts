import { describe, expect, it } from "vitest";

import { getDateAvailabilitySnapshot } from "@/lib/availability/date-exceptions";
import { resolveDayWorkingWindowsForStaff } from "@/server/services/availability-windows.service";
import type {
  AvailabilityException,
  AvailabilityRule,
} from "@/server/repositories/availability";

const STAFF_ID = "4506846e-1fef-4867-a009-8578bbd4d36f";

describe("resolveDayWorkingWindowsForStaff", () => {
  it("staff-specific open hours override a global closed row on the same date", () => {
    const exceptions: AvailabilityException[] = [
      {
        id: "1",
        business_id: "b1",
        staff_member_id: null,
        location_id: null,
        exception_date: "2026-06-11",
        closed: true,
        start_time: null,
        end_time: null,
        reason: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        business_id: "b1",
        staff_member_id: STAFF_ID,
        location_id: null,
        exception_date: "2026-06-11",
        closed: false,
        start_time: "09:00:00",
        end_time: "13:00:00",
        reason: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const windows = resolveDayWorkingWindowsForStaff({
      dateInput: "2026-06-11",
      rules: [],
      exceptions,
      staffMemberId: STAFF_ID,
    });

    expect(windows).toEqual([
      { startMinutes: 9 * 60, endMinutes: 13 * 60 },
    ]);
  });

  it("global closed blocks staff without their own open ranges", () => {
    const exceptions: AvailabilityException[] = [
      {
        id: "1",
        business_id: "b1",
        staff_member_id: null,
        location_id: null,
        exception_date: "2026-06-11",
        closed: true,
        start_time: null,
        end_time: null,
        reason: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const windows = resolveDayWorkingWindowsForStaff({
      dateInput: "2026-06-11",
      rules: [],
      exceptions,
      staffMemberId: STAFF_ID,
    });

    expect(windows).toEqual([]);
  });

  it("merges duplicate global and staff weekly rules", () => {
    const rules: AvailabilityRule[] = [
      {
        id: "1",
        business_id: "b1",
        staff_member_id: null,
        location_id: null,
        day_of_week: 2,
        start_time: "09:00:00",
        end_time: "13:00:00",
        active: true,
        effective_from: null,
        effective_until: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        business_id: "b1",
        staff_member_id: STAFF_ID,
        location_id: null,
        day_of_week: 2,
        start_time: "09:00:00",
        end_time: "13:00:00",
        active: true,
        effective_from: null,
        effective_until: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        business_id: "b1",
        staff_member_id: STAFF_ID,
        location_id: null,
        day_of_week: 2,
        start_time: "15:00:00",
        end_time: "17:00:00",
        active: true,
        effective_from: null,
        effective_until: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const windows = resolveDayWorkingWindowsForStaff({
      dateInput: "2026-06-09",
      rules,
      exceptions: [],
      staffMemberId: STAFF_ID,
    });

    expect(windows).toEqual([
      { startMinutes: 9 * 60, endMinutes: 13 * 60 },
      { startMinutes: 15 * 60, endMinutes: 17 * 60 },
    ]);
  });
});

describe("getDateAvailabilitySnapshot", () => {
  it("shows open ranges for staff when global closed exists", () => {
    const exceptions: AvailabilityException[] = [
      {
        id: "1",
        business_id: "b1",
        staff_member_id: null,
        location_id: null,
        exception_date: "2026-06-11",
        closed: true,
        start_time: null,
        end_time: null,
        reason: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        business_id: "b1",
        staff_member_id: STAFF_ID,
        location_id: null,
        exception_date: "2026-06-11",
        closed: false,
        start_time: "09:00:00",
        end_time: "13:00:00",
        reason: null,
        created_at: "",
        updated_at: "",
      },
    ];

    const snapshot = getDateAvailabilitySnapshot(
      exceptions,
      "2026-06-11",
      STAFF_ID,
    );

    expect(snapshot.closed).toBe(false);
    expect(snapshot.ranges).toEqual([
      { start_time: "09:00", end_time: "13:00" },
    ]);
  });
});
