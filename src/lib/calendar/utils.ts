export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Sunday = 0 … Saturday = 6 — matches Hebrew weekday header order (א׳ … ש׳). */
export const HEBREW_WEEKDAY_HEADERS = [
  "א׳",
  "ב׳",
  "ג׳",
  "ד׳",
  "ה׳",
  "ו׳",
  "ש׳",
] as const;

/** Index 0=Sunday … 6=Saturday for calendar column alignment. */
export function getCalendarWeekdayIndex(date: Date): number {
  return startOfDay(date).getDay();
}

/** Start of the Israeli/Hebrew week (Sunday), not ISO Monday. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

/** Which weekday column (0–6) a date falls in for a month grid anchored to anchorMonth. */
export function weekdayColumnInMonthGrid(date: Date, anchorMonth: Date): number {
  const gridStart = startOfWeek(startOfMonth(anchorMonth));
  const dayOffset = Math.round(
    (startOfDay(date).getTime() - gridStart.getTime()) / 86_400_000,
  );
  return ((dayOffset % 7) + 7) % 7;
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD or ISO timestamp to local start-of-day. */
export function parseCalendarDateBound(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return startOfDay(new Date(y!, m! - 1, d!));
  }
  return startOfDay(new Date(value));
}

export function lastDayOfMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const last = new Date(y!, m!, 0).getDate();
  return `${monthKey}-${String(last).padStart(2, "0")}`;
}

export function formatHebrewDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}

export function formatHebrewTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}

export function formatHebrewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}

export function formatHebrewMonthTitle(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type CalendarViewRange = "day" | "week" | "month" | "list";

export function rangeForCalendarView(
  anchorDate: Date,
  view: CalendarViewRange,
): { from: Date; to: Date } {
  if (view === "day") {
    return { from: startOfDay(anchorDate), to: endOfDay(anchorDate) };
  }
  if (view === "week" || view === "list") {
    if (view === "list") {
      return {
        from: startOfWeek(startOfMonth(anchorDate)),
        to: endOfWeek(endOfMonth(anchorDate)),
      };
    }
    return { from: startOfWeek(anchorDate), to: endOfWeek(anchorDate) };
  }
  return {
    from: startOfWeek(startOfMonth(anchorDate)),
    to: endOfWeek(endOfMonth(anchorDate)),
  };
}

export function isWithinRange(iso: string, from: Date, to: Date): boolean {
  const at = new Date(iso);
  return at >= from && at <= to;
}

/** Compact count for calendar cell badges (e.g. "3 פנויים" not "84 פנויים"). */
export function formatCompactCount(count: number): string {
  if (count <= 0) return "0";
  if (count > 99) return "99+";
  return String(count);
}
