export const DEFAULT_CALENDAR_TIMEZONE = "Asia/Jerusalem";

/** YYYY-MM-DD for "now" in the business timezone. */
export function todayDateInTimezone(
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** Add calendar days to a YYYY-MM-DD date in the given timezone. */
export function addDaysToDateInput(
  dateInput: string,
  days: number,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): string {
  const anchor = wallClockToUtcDate(dateInput, 12 * 60, timeZone);
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(
    new Date(anchor.getTime() + days * 86_400_000),
  );
}

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** ISO weekday (1=Mon … 7=Sun) for a YYYY-MM-DD calendar date in the given timezone. */
export function getIsoDayOfWeekForDateInput(
  dateInput: string,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): number {
  const ref = new Date(`${dateInput}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(ref);
  const iso = WEEKDAY_TO_ISO[weekday];
  if (!iso) {
    throw new Error(`Unknown weekday label: ${weekday}`);
  }
  return iso;
}

/** Wall-clock minutes from midnight on dateInput → UTC instant in timeZone. */
export function wallClockToUtcDate(
  dateInput: string,
  minutesFromMidnight: number,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): Date {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  let instant = new Date(
    Date.UTC(
      Number(dateInput.slice(0, 4)),
      Number(dateInput.slice(5, 7)) - 1,
      Number(dateInput.slice(8, 10)),
      hours,
      mins,
    ),
  );

  for (let i = 0; i < 5; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((part) => [part.type, part.value]),
    );
    const zonedMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    const targetMs = Date.UTC(
      Number(dateInput.slice(0, 4)),
      Number(dateInput.slice(5, 7)) - 1,
      Number(dateInput.slice(8, 10)),
      hours,
      mins,
    );
    instant = new Date(instant.getTime() + (targetMs - zonedMs));
  }

  return instant;
}

/** Minutes from local midnight on the slot's calendar day in timeZone. */
export function wallClockMinutesFromIso(
  iso: string,
  timeZone = DEFAULT_CALENDAR_TIMEZONE,
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}
