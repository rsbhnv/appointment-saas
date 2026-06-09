"use client";

import {
  addDays,
  formatHebrewDate,
  HEBREW_WEEKDAY_HEADERS,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

export type DateCellMeta = {
  hasDateSpecific: boolean;
  closed: boolean;
  rangeCount: number;
  appointmentCount: number;
  slotCount: number;
};

type AvailabilityMonthGridProps = {
  anchorDate: Date;
  selectedDates: Set<string>;
  dateMeta: Record<string, DateCellMeta | undefined>;
  onToggleDate: (date: Date) => void;
  disabled?: boolean;
};

export function AvailabilityMonthGrid({
  anchorDate,
  selectedDates,
  dateMeta,
  onToggleDate,
  disabled = false,
}: AvailabilityMonthGridProps) {
  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const todayKey = toDateInputValue(new Date());

  return (
    <div className="space-y-2" dir="rtl">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-on-surface-variant sm:gap-2">
        {HEBREW_WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day) => {
          const dateKey = toDateInputValue(day);
          const inMonth = day.getMonth() === anchorDate.getMonth();
          const isSelected = selectedDates.has(dateKey);
          const isToday = dateKey === todayKey;
          const meta = dateMeta[dateKey];
          const isPast = startOfDay(day) < startOfDay(new Date());

          return (
            <button
              key={dateKey}
              type="button"
              disabled={disabled}
              onClick={() => onToggleDate(day)}
              className={cn(
                "min-h-[4.5rem] rounded-lg border p-0.5 text-start transition sm:min-h-24 sm:p-2",
                inMonth
                  ? "border-outline-variant/25 bg-surface-container-lowest"
                  : "border-transparent bg-surface-container-low/50 opacity-50",
                isSelected &&
                  "border-primary bg-primary/15 ring-2 ring-primary/35 opacity-100",
                isToday && !isSelected && "ring-1 ring-secondary/50",
                disabled && "cursor-not-allowed opacity-60",
              )}
              aria-pressed={isSelected}
              aria-label={formatHebrewDate(day.toISOString())}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  isSelected ? "bg-primary text-on-primary" : "text-on-surface",
                  isPast && !isSelected && "text-on-surface-variant",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-0.5 flex flex-wrap gap-0.5 sm:mt-1">
                {meta?.hasDateSpecific ? (
                  meta.closed ? (
                    <span className="rounded bg-destructive/10 px-1 py-0.5 text-[9px] text-destructive sm:text-[10px]">
                      סגור
                    </span>
                  ) : (
                    <span className="rounded bg-surface-container-high px-1 py-0.5 text-[9px] text-on-surface-variant sm:text-[10px]">
                      {meta.rangeCount} טווחים
                    </span>
                  )
                ) : null}
                {(meta?.appointmentCount ?? 0) > 0 ? (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary sm:text-[10px]">
                    {meta!.appointmentCount} תורים
                  </span>
                ) : null}
                {(meta?.slotCount ?? 0) > 0 ? (
                  <span className="rounded bg-secondary/10 px-1 py-0.5 text-[9px] text-secondary sm:text-[10px]">
                    {meta!.slotCount} פנויים
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
