"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  addDays,
  formatHebrewMonthTitle,
  HEBREW_WEEKDAY_HEADERS,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";

type BookingMonthCalendarProps = {
  anchorMonth: Date;
  onAnchorMonthChange: (date: Date) => void;
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
  /** YYYY-MM-DD for "today" in the business timezone (defaults to browser local). */
  todayKey?: string;
  loading?: boolean;
};

export function BookingMonthCalendar({
  anchorMonth,
  onAnchorMonthChange,
  availableDates,
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  todayKey: todayKeyProp,
  loading = false,
}: BookingMonthCalendarProps) {
  const monthStart = startOfMonth(anchorMonth);
  const gridStart = startOfWeek(monthStart);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );
  const todayKey = todayKeyProp ?? toDateInputValue(new Date());

  function prevMonth() {
    onAnchorMonthChange(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    onAnchorMonthChange(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-4 rounded-3xl border border-outline-variant/15 bg-surface-container-low/50 p-4 sm:p-5" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={nextMonth}
          aria-label="חודש הבא"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <p className="text-base font-bold text-on-surface">
          {formatHebrewMonthTitle(anchorMonth)}
          {loading ? (
            <span className="ms-2 text-sm font-normal text-on-surface-variant">טוען...</span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={prevMonth}
          aria-label="חודש קודם"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-on-surface-variant">
        {HEBREW_WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const dateKey = toDateInputValue(day);
          const inMonth = day.getMonth() === anchorMonth.getMonth();
          const isAvailable = availableDates.has(dateKey);
          const isSelected = selectedDate === dateKey;
          const isPast = dateKey < todayKey;
          const outOfRange =
            (minDate ? dateKey < minDate : false) ||
            (maxDate ? dateKey > maxDate : false);
          const clickable = inMonth && isAvailable && !isPast && !outOfRange;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelectDate(dateKey)}
              className={cn(
                "mx-auto flex size-10 items-center justify-center rounded-full text-sm font-medium transition sm:size-11",
                !inMonth && "opacity-25",
                inMonth && !clickable && "cursor-default text-on-surface-variant/35",
                clickable &&
                  !isSelected &&
                  "cursor-pointer bg-primary/8 text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected &&
                  "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(28,32,24,0.15)] ring-2 ring-primary/25",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
