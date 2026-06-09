"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarX, Clock, Eye, EyeOff } from "lucide-react";

import { appointmentDateKey } from "@/lib/availability/schedule-summary";
import { Button } from "@/components/ui/button";

import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import { formatHebrewDate, formatHebrewTime } from "@/lib/calendar/utils";
import { cancelAppointmentAction } from "@/server/actions/appointments";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set<CalendarAppointment["status"]>([
  "pending",
  "confirmed",
]);

const CANCEL_ERROR_COPY: Record<string, string> = {
  invalid_input: "לא ניתן לבטל — פרטים חסרים.",
  not_found: "התור לא נמצא.",
  forbidden: "אין הרשאה לבטל תור.",
  unknown: "אירעה שגיאה בביטול.",
};

type AvailabilitySchedulePanelProps = {
  selectedDates: string[];
  appointments: CalendarAppointment[];
  availableSlots: CalendarAvailableSlot[];
  canManage: boolean;
  staffMemberId: string;
  onScheduleChange: () => void;
  onCloseSelectedDays: () => void;
  closeDaysPending?: boolean;
};

type DayScheduleItem =
  | { kind: "appointment"; appointment: CalendarAppointment }
  | { kind: "slot"; slot: CalendarAvailableSlot };

function slotItemKey(slot: CalendarAvailableSlot): string {
  return `${slot.staffMemberId ?? ""}|${slot.startsAt}`;
}

function itemsForDate(
  date: string,
  appointments: CalendarAppointment[],
  slots: CalendarAvailableSlot[],
  staffMemberId: string,
): DayScheduleItem[] {
  const dayAppointments = appointments.filter((row) => {
    if (!ACTIVE_STATUSES.has(row.status)) return false;
    if (appointmentDateKey(row.startsAt) !== date) return false;
    if (staffMemberId && row.staff.id !== staffMemberId) return false;
    return true;
  });

  const daySlots = slots.filter((row) => {
    if (row.date !== date) return false;
    if (staffMemberId && row.staffMemberId !== staffMemberId) return false;
    return true;
  });

  const seenSlotKeys = new Set<string>();
  const uniqueDaySlots = daySlots.filter((row) => {
    const key = slotItemKey(row);
    if (seenSlotKeys.has(key)) return false;
    seenSlotKeys.add(key);
    return true;
  });

  const items: DayScheduleItem[] = [
    ...dayAppointments.map((appointment) => ({ kind: "appointment" as const, appointment })),
    ...uniqueDaySlots.map((slot) => ({ kind: "slot" as const, slot })),
  ];

  return items.sort((a, b) => {
    const aStart = a.kind === "appointment" ? a.appointment.startsAt : a.slot.startsAt;
    const bStart = b.kind === "appointment" ? b.appointment.startsAt : b.slot.startsAt;
    return aStart.localeCompare(bStart);
  });
}

export function AvailabilitySchedulePanel({
  selectedDates,
  appointments,
  availableSlots,
  canManage,
  staffMemberId,
  onScheduleChange,
  onCloseSelectedDays,
  closeDaysPending = false,
}: AvailabilitySchedulePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [showFreeSlots, setShowFreeSlots] = useState(true);
  const [isPending, startTransition] = useTransition();

  const sortedDates = [...selectedDates].sort((a, b) => a.localeCompare(b));

  const freeSlotCount = useMemo(() => {
    return sortedDates.reduce((total, date) => {
      const slots = availableSlots.filter((row) => {
        if (row.date !== date) return false;
        if (staffMemberId && row.staffMemberId !== staffMemberId) return false;
        return true;
      });
      return total + slots.length;
    }, 0);
  }, [sortedDates, availableSlots, staffMemberId]);

  function cancelAppointment(appointment: CalendarAppointment) {
    const label = `${formatHebrewTime(appointment.startsAt)} · ${appointment.customer.fullName}`;
    const confirmed = window.confirm(
      `לבטל את התור ${label}?\nהסלוט ייפתח מחדש לאחר הביטול.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction({
        id: appointment.id,
        cancellationReason: "בוטל ממסך זמינות לצורך שינוי מערכת שעות",
      });
      if (!result.ok) {
        setError(CANCEL_ERROR_COPY[result.error] ?? CANCEL_ERROR_COPY.unknown);
        return;
      }
      onScheduleChange();
    });
  }

  if (selectedDates.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>תורים וסלוטים</CardTitle>
          <CardDescription>
            בחרו תאריך בלוח כדי לראות תורים תפוסים וסלוטים פנויים.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>תורים וסלוטים לתאריכים שנבחרו</CardTitle>
        <CardDescription>
          רק תורים תפוסים (כחול) ניתנים לביטול בלחיצה. סלוטים פנויים (ירוק) אינם
          נמחקים — לסגירתם השתמשו ב״סגור ימים״ או בעריכת שעות העבודה.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={closeDaysPending || isPending || freeSlotCount === 0}
              onClick={onCloseSelectedDays}
            >
              סגור ימים שנבחרו — הסרת {freeSlotCount} סלוטים פנויים
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFreeSlots((value) => !value)}
            >
              {showFreeSlots ? (
                <>
                  <EyeOff className="size-4" aria-hidden />
                  הסתר סלוטים פנויים
                </>
              ) : (
                <>
                  <Eye className="size-4" aria-hidden />
                  הצג סלוטים פנויים
                </>
              )}
            </Button>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {isPending ? (
          <p className="text-sm text-on-surface-variant">מעדכן...</p>
        ) : null}

        {sortedDates.map((date) => {
          const items = itemsForDate(
            date,
            appointments,
            availableSlots,
            staffMemberId,
          );
          const visibleItems = items.filter(
            (item) => showFreeSlots || item.kind === "appointment",
          );
          return (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-semibold text-on-surface">
                {formatHebrewDate(`${date}T12:00:00`)}
              </h3>
              {visibleItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant/30 px-3 py-4 text-sm text-on-surface-variant">
                  {!showFreeSlots && items.some((item) => item.kind === "slot")
                    ? "אין תורים פעילים. סלוטים פנויים מוסתרים."
                    : "אין תורים פעילים או סלוטים פנויים לתאריך זה."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleItems.map((item) =>
                    item.kind === "appointment" ? (
                      <li key={item.appointment.id}>
                        <button
                          type="button"
                          disabled={!canManage || isPending}
                          onClick={() => cancelAppointment(item.appointment)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-start transition",
                            canManage &&
                              "hover:border-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            (!canManage || isPending) && "cursor-default opacity-80",
                          )}
                        >
                          <CalendarX
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-on-surface">
                              {formatHebrewTime(item.appointment.startsAt)}–
                              {formatHebrewTime(item.appointment.endsAt)}
                            </p>
                            <p className="truncate text-sm text-on-surface-variant">
                              {item.appointment.customer.fullName} ·{" "}
                              {item.appointment.service.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <AppointmentStatusBadge
                                status={item.appointment.status}
                              />
                              {canManage ? (
                                <span className="text-xs text-primary">
                                  לחץ לביטול תור
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </li>
                    ) : (
                      <li
                        key={slotItemKey(item.slot)}
                        className="flex items-start gap-3 rounded-lg border border-dashed border-secondary/40 bg-secondary/5 p-3 select-none"
                        aria-hidden={false}
                      >
                        <Clock
                          className="mt-0.5 size-4 shrink-0 text-secondary"
                          aria-hidden
                        />
                        <div>
                          <p className="font-medium text-secondary">
                            {formatHebrewTime(item.slot.startsAt)}–
                            {formatHebrewTime(item.slot.endsAt)} · פנוי (לא ניתן למחוק)
                          </p>
                          {item.slot.staffName ? (
                            <p className="text-xs text-on-surface-variant">
                              {item.slot.staffName}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
