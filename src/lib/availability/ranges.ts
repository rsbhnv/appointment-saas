export type TimeRangeInput = {
  start_time: string;
  end_time: string;
};

export type TimeRangeValidationError =
  | "empty"
  | "invalid_order"
  | "overlap";

export function normalizeTimeToHHMM(time: string): string {
  return time.trim().slice(0, 5);
}

export function parseTimeToMinutes(time: string): number {
  const normalized = normalizeTimeToHHMM(time);
  const [h, m] = normalized.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeRangesOverlap(a: TimeRangeInput, b: TimeRangeInput): boolean {
  const aStart = parseTimeToMinutes(a.start_time);
  const aEnd = parseTimeToMinutes(a.end_time);
  const bStart = parseTimeToMinutes(b.start_time);
  const bEnd = parseTimeToMinutes(b.end_time);
  return aStart < bEnd && bStart < aEnd;
}

export function validateTimeRanges(
  ranges: TimeRangeInput[],
): { ok: true; ranges: TimeRangeInput[] } | { ok: false; error: TimeRangeValidationError } {
  if (ranges.length === 0) {
    return { ok: false, error: "empty" };
  }

  const normalized: TimeRangeInput[] = [];
  for (const range of ranges) {
    const start_time = normalizeTimeToHHMM(range.start_time);
    const end_time = normalizeTimeToHHMM(range.end_time);
    if (parseTimeToMinutes(start_time) >= parseTimeToMinutes(end_time)) {
      return { ok: false, error: "invalid_order" };
    }
    normalized.push({ start_time, end_time });
  }

  const sorted = [...normalized].sort(
    (a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time),
  );

  for (let i = 1; i < sorted.length; i++) {
    if (timeRangesOverlap(sorted[i - 1]!, sorted[i]!)) {
      return { ok: false, error: "overlap" };
    }
  }

  return { ok: true, ranges: sorted };
}

export const RANGE_ERROR_COPY: Record<TimeRangeValidationError, string> = {
  empty: "הוסף לפחות טווח שעות אחד.",
  invalid_order: "שעת הסיום חייבת להיות אחרי שעת ההתחלה.",
  overlap: "טווחי השעות חופפים — הסדר או מחק טווח.",
};
