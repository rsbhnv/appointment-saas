"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatHebrewDate, formatHebrewMonthTitle } from "@/lib/calendar/utils";
import type { CalendarView } from "@/lib/calendar/labels";
import {
  addDays,
  endOfWeek,
  startOfWeek,
} from "@/lib/calendar/utils";

type DateNavigatorProps = {
  anchorDate: Date;
  view: CalendarView;
  onAnchorChange: (date: Date) => void;
};

function labelForRange(anchorDate: Date, view: CalendarView): string {
  if (view === "day") {
    return formatHebrewDate(anchorDate.toISOString());
  }
  if (view === "week" || view === "list") {
    const start = startOfWeek(anchorDate);
    const end = endOfWeek(anchorDate);
    return `${formatHebrewDate(start.toISOString())} – ${formatHebrewDate(end.toISOString())}`;
  }
  return formatHebrewMonthTitle(anchorDate);
}

function shiftAnchor(date: Date, view: CalendarView, direction: -1 | 1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week" || view === "list") return addDays(date, direction * 7);
  return new Date(date.getFullYear(), date.getMonth() + direction, 1);
}

export function DateNavigator({
  anchorDate,
  view,
  onAnchorChange,
}: DateNavigatorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={view === "month" ? "החודש הקודם" : "הקודם"}
          onClick={() => onAnchorChange(shiftAnchor(anchorDate, view, -1))}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAnchorChange(new Date())}
        >
          היום
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={view === "month" ? "החודש הבא" : "הבא"}
          onClick={() => onAnchorChange(shiftAnchor(anchorDate, view, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>
      <p className="min-w-0 flex-1 text-sm font-medium text-on-surface sm:flex-none">
        {mounted ? labelForRange(anchorDate, view) : ""}
      </p>
    </div>
  );
}
