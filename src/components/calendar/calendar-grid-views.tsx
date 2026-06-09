"use client";

import type { MouseEvent } from "react";

import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import {
  addDays,
  formatCompactCount,
  formatHebrewDate,
  formatHebrewTime,
  HEBREW_WEEKDAY_HEADERS,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
} from "@/lib/calendar/utils";
import { AppointmentCard } from "@/components/calendar/appointment-card";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const MONTH_CELL_APPOINTMENT_LIMIT = 3;
const WEEK_CELL_APPOINTMENT_LIMIT = 4;

function AppointmentChip({
  appointment,
  onSelect,
  className,
}: {
  appointment: CalendarAppointment;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const isInactive =
    appointment.status === "cancelled" || appointment.status === "no_show";

  return (
    <button
      type="button"
      className={cn(
        "block w-full truncate rounded bg-primary/10 px-1 py-0.5 text-start text-[10px] text-primary sm:text-xs",
        isInactive && "bg-destructive/10 text-destructive line-through opacity-70",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(appointment.id);
      }}
      aria-label={`תור ${formatHebrewTime(appointment.startsAt)} — ${appointment.customer.fullName}`}
      title={`${appointment.customer.fullName} · ${appointment.service.name}`}
    >
      {formatHebrewTime(appointment.startsAt)} · {appointment.customer.fullName}
    </button>
  );
}

function MoreAppointmentsChip({
  count,
  onClick,
}: {
  count: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      className="block w-full rounded bg-primary/5 px-1 py-0.5 text-start text-[10px] font-medium text-primary hover:bg-primary/10"
      onClick={onClick}
    >
      +{count} נוספים
    </button>
  );
}

type CalendarGridProps = {
  appointments: CalendarAppointment[];
  anchorDate: Date;
  view: "day" | "week" | "month";
  onSelect: (id: string) => void;
  selectedDateKey?: string | null;
  availableSlotsByDate?: Record<string, CalendarAvailableSlot[]>;
  onDateSelect?: (date: Date) => void;
};

function appointmentsForDay(
  appointments: CalendarAppointment[],
  day: Date,
): CalendarAppointment[] {
  const key = startOfDay(day).toDateString();
  return appointments.filter(
    (row) => startOfDay(new Date(row.startsAt)).toDateString() === key,
  );
}

type DayTimelineItem =
  | { kind: "appointment"; appointment: CalendarAppointment }
  | { kind: "slot"; slot: CalendarAvailableSlot };

function buildDayTimeline(
  appointments: CalendarAppointment[],
  slots: CalendarAvailableSlot[],
): DayTimelineItem[] {
  const items: DayTimelineItem[] = [
    ...appointments.map((appointment) => ({ kind: "appointment" as const, appointment })),
    ...slots.map((slot) => ({ kind: "slot" as const, slot })),
  ];
  return items.sort((a, b) => {
    const aStart = a.kind === "appointment" ? a.appointment.startsAt : a.slot.startsAt;
    const bStart = b.kind === "appointment" ? b.appointment.startsAt : b.slot.startsAt;
    return aStart.localeCompare(bStart);
  });
}

function WeekDayColumn({
  day,
  appointments,
  availableSlotsByDate,
  selectedDateKey,
  onSelect,
  onDateSelect,
  compact = false,
}: {
  day: Date;
  appointments: CalendarAppointment[];
  availableSlotsByDate: Record<string, CalendarAvailableSlot[]>;
  selectedDateKey: string | null;
  onSelect: (id: string) => void;
  onDateSelect?: (date: Date) => void;
  compact?: boolean;
}) {
  const dateKey = toDateInputValue(day);
  const dayItems = appointmentsForDay(appointments, day);
  const slotCount = availableSlotsByDate[dateKey]?.length ?? 0;
  const isSelected = dateKey === selectedDateKey;
  const clickable = Boolean(onDateSelect);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onDateSelect?.(day) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onDateSelect?.(day);
              }
            }
          : undefined
      }
      className={cn(
        "flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 text-start",
        compact ? "min-h-0" : "min-h-36",
        isSelected && "border-primary ring-1 ring-primary/30",
        clickable &&
          "cursor-pointer transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <div className="mb-2 w-full py-1 text-xs font-semibold text-on-surface sm:text-sm">
        {formatHebrewDate(day.toISOString())}
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {dayItems.length > 0 ? (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary sm:text-xs">
            {formatCompactCount(dayItems.length)} תורים
          </span>
        ) : null}
        {slotCount > 0 ? (
          <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] text-secondary sm:text-xs">
            {formatCompactCount(slotCount)} פנויים
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
        {dayItems.slice(0, WEEK_CELL_APPOINTMENT_LIMIT).map((appointment) => (
          <AppointmentChip
            key={appointment.id}
            appointment={appointment}
            onSelect={onSelect}
          />
        ))}
        <MoreAppointmentsChip
          count={dayItems.length - WEEK_CELL_APPOINTMENT_LIMIT}
          onClick={(event) => {
            event.stopPropagation();
            onDateSelect?.(day);
          }}
        />
        {(availableSlotsByDate[dateKey] ?? []).slice(0, 2).map((slot) => (
          <p
            key={slot.startsAt}
            className="truncate rounded bg-secondary/10 px-1 py-0.5 text-[10px] text-secondary sm:text-xs"
          >
            {formatHebrewTime(slot.startsAt)} פנוי
          </p>
        ))}
      </div>
    </div>
  );
}

export function CalendarGridViews({
  appointments,
  anchorDate,
  view,
  onSelect,
  selectedDateKey = null,
  availableSlotsByDate = {},
  onDateSelect,
}: CalendarGridProps) {
  if (view === "day") {
    const dateKey = toDateInputValue(anchorDate);
    const dayAppointments = appointmentsForDay(appointments, anchorDate);
    const daySlots = availableSlotsByDate[dateKey] ?? [];
    const timeline = buildDayTimeline(dayAppointments, daySlots);

    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4">
        <p className="mb-4 text-sm font-semibold text-on-surface">
          {formatHebrewDate(anchorDate.toISOString())}
        </p>
        <div className="grid gap-3 md:grid-cols-[4rem_1fr]">
          <div className="hidden md:block">
            {HOURS.map((hour) => (
              <div key={hour} className="h-14 text-xs text-outline">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {timeline.length === 0 ? (
              <p className="rounded-lg border border-dashed border-outline-variant/30 p-6 text-center text-sm text-on-surface-variant">
                אין תורים או זמינות ביום זה
              </p>
            ) : (
              timeline.map((item) =>
                item.kind === "appointment" ? (
                  <div key={item.appointment.id} className="flex gap-3">
                    <span className="w-16 shrink-0 text-xs text-outline">
                      {formatHebrewTime(item.appointment.startsAt)}
                    </span>
                    <AppointmentCard
                      appointment={item.appointment}
                      onClick={() => onSelect(item.appointment.id)}
                      compact
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <div
                    key={item.slot.startsAt}
                    className="flex gap-3 rounded-lg border border-dashed border-secondary/40 bg-secondary/5 px-3 py-2"
                  >
                    <span className="w-16 shrink-0 text-xs text-secondary">
                      {formatHebrewTime(item.slot.startsAt)}
                    </span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-secondary">
                        {formatHebrewTime(item.slot.startsAt)}–
                        {formatHebrewTime(item.slot.endsAt)} · פנוי
                      </p>
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "week") {
    const weekStart = startOfWeek(anchorDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-3">
        <div className="space-y-3 md:hidden">
          {days.map((day) => (
            <WeekDayColumn
              key={toDateInputValue(day)}
              day={day}
              appointments={appointments}
              availableSlotsByDate={availableSlotsByDate}
              selectedDateKey={selectedDateKey}
              onSelect={onSelect}
              onDateSelect={onDateSelect}
              compact
            />
          ))}
        </div>
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <WeekDayColumn
                key={toDateInputValue(day)}
                day={day}
                appointments={appointments}
                availableSlotsByDate={availableSlotsByDate}
                selectedDateKey={selectedDateKey}
                onSelect={onSelect}
                onDateSelect={onDateSelect}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = startOfDay(new Date());

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-on-surface-variant sm:gap-2">
        {HEBREW_WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day) => {
          const dayItems = appointmentsForDay(appointments, day);
          const inMonth = day.getMonth() === anchorDate.getMonth();
          const dateKey = toDateInputValue(day);
          const isPast = startOfDay(day) < today;
          const isSelected = dateKey === selectedDateKey;
          const availableSlotCount = availableSlotsByDate[dateKey]?.length ?? 0;
          const clickable = Boolean(onDateSelect);
          return (
            <div
              key={dateKey}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onDateSelect?.(day) : undefined}
              onKeyDown={
                clickable
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onDateSelect?.(day);
                      }
                    }
                  : undefined
              }
              className={cn(
                "min-h-[5.5rem] rounded-lg border border-outline-variant/20 p-0.5 sm:min-h-28 sm:p-2",
                inMonth ? "bg-surface-container-lowest" : "bg-surface-container-low/40 opacity-60",
                isSelected &&
                  "border-primary bg-primary/10 opacity-100 ring-1 ring-primary/30",
                isPast && !isSelected && "text-on-surface-variant",
                clickable &&
                  "cursor-pointer transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium text-on-surface",
                    isPast && "opacity-80",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {dayItems.length > 0 ? (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                    {formatCompactCount(dayItems.length)} תורים
                  </span>
                ) : null}
                {availableSlotCount > 0 ? (
                  <span className="rounded bg-secondary/10 px-1 py-0.5 text-[10px] text-secondary">
                    {formatCompactCount(availableSlotCount)} פנויים
                  </span>
                ) : null}
              </div>
              <div className="mt-1 space-y-1 max-sm:hidden">
                {dayItems.slice(0, MONTH_CELL_APPOINTMENT_LIMIT).map((appointment) => (
                  <AppointmentChip
                    key={appointment.id}
                    appointment={appointment}
                    onSelect={onSelect}
                  />
                ))}
                <MoreAppointmentsChip
                  count={dayItems.length - MONTH_CELL_APPOINTMENT_LIMIT}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDateSelect?.(day);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
