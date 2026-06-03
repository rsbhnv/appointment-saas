import {
  normalizeTimeToHHMM,
  type TimeRangeInput,
} from "@/lib/availability/ranges";
import type { AvailabilityException } from "@/server/repositories/availability";

export type DateAvailabilitySnapshot = {
  closed: boolean;
  ranges: TimeRangeInput[];
  hasDateSpecific: boolean;
};

export function getDateAvailabilitySnapshot(
  exceptions: AvailabilityException[],
  date: string,
  staffMemberId: string | null,
): DateAvailabilitySnapshot {
  const scoped = exceptions.filter(
    (row) =>
      row.exception_date === date &&
      (staffMemberId === null
        ? row.staff_member_id === null
        : row.staff_member_id === staffMemberId),
  );

  if (scoped.length === 0) {
    return { closed: false, ranges: [], hasDateSpecific: false };
  }

  if (scoped.some((row) => row.closed)) {
    return { closed: true, ranges: [], hasDateSpecific: true };
  }

  const ranges = scoped
    .filter((row) => row.start_time && row.end_time)
    .map((row) => ({
      start_time: normalizeTimeToHHMM(row.start_time!),
      end_time: normalizeTimeToHHMM(row.end_time!),
    }))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return { closed: false, ranges, hasDateSpecific: true };
}

export function snapshotsMatch(
  a: DateAvailabilitySnapshot,
  b: DateAvailabilitySnapshot,
): boolean {
  if (a.closed !== b.closed) return false;
  if (a.ranges.length !== b.ranges.length) return false;
  return a.ranges.every(
    (range, index) =>
      range.start_time === b.ranges[index]?.start_time &&
      range.end_time === b.ranges[index]?.end_time,
  );
}
