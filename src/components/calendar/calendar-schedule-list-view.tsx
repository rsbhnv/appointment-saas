"use client";

import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import { formatCompactCount, formatHebrewDate, formatHebrewTime, toDateInputValue } from "@/lib/calendar/utils";
import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";
import { cn } from "@/lib/utils";

type CalendarScheduleListViewProps = {
  appointments: CalendarAppointment[];
  availableSlots: CalendarAvailableSlot[];
  onSelectAppointment: (id: string) => void;
};

function groupByDate<T extends { date?: string; startsAt: string }>(
  items: T[],
  dateOf: (item: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dateOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return map;
}

export function CalendarScheduleListView({
  appointments,
  availableSlots,
  onSelectAppointment,
}: CalendarScheduleListViewProps) {
  const appointmentsByDate = groupByDate(appointments, (row) =>
    toDateInputValue(new Date(row.startsAt)),
  );
  const slotsByDate = groupByDate(availableSlots, (row) => row.date);
  const dateKeys = [...new Set([...appointmentsByDate.keys(), ...slotsByDate.keys()])].sort();

  if (dateKeys.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center text-sm text-on-surface-variant">
        אין תורים או זמינות בתקופה זו
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {dateKeys.map((dateKey) => {
        const dayAppointments = appointmentsByDate.get(dateKey) ?? [];
        const daySlots = slotsByDate.get(dateKey) ?? [];
        return (
          <section
            key={dateKey}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden"
          >
            <header className="border-b border-outline-variant/20 bg-surface-container-low px-4 py-3">
              <h3 className="text-sm font-semibold text-on-surface">
                {formatHebrewDate(`${dateKey}T12:00:00`)}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {formatCompactCount(dayAppointments.length)} תורים ·{" "}
                {formatCompactCount(daySlots.length)} פנויים
              </p>
            </header>
            <div className="divide-y divide-outline-variant/15">
              {dayAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onSelectAppointment(appointment.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-start transition hover:bg-surface-container-low/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface">
                      {formatHebrewTime(appointment.startsAt)}–
                      {formatHebrewTime(appointment.endsAt)} · {appointment.customer.fullName}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {appointment.service.name}
                      {appointment.staff.name ? ` · ${appointment.staff.name}` : ""}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </button>
              ))}
              {daySlots.slice(0, 12).map((slot) => (
                <div
                  key={`${slot.startsAt}-${slot.endsAt}`}
                  className={cn(
                    "px-4 py-2.5 text-sm",
                    dayAppointments.length > 0 && "bg-secondary/5",
                  )}
                >
                  <p className="font-medium text-secondary">
                    {formatHebrewTime(slot.startsAt)}–{formatHebrewTime(slot.endsAt)} · פנוי
                  </p>
                </div>
              ))}
              {daySlots.length > 12 ? (
                <p className="px-4 py-2 text-xs text-on-surface-variant">
                  +{daySlots.length - 12} סלוטים פנויים נוספים
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
