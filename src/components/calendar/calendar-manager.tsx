"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Filter, Plus } from "lucide-react";

import { AppointmentDetailDrawer } from "@/components/calendar/appointment-detail-drawer";
import { AppointmentForm } from "@/components/calendar/appointment-form";
import { CalendarGridViews } from "@/components/calendar/calendar-grid-views";
import { CalendarScheduleListView } from "@/components/calendar/calendar-schedule-list-view";
import { CalendarViewSwitcher } from "@/components/calendar/calendar-view-switcher";
import { DateNavigator } from "@/components/calendar/date-navigator";
import { EmptyCalendarState } from "@/components/calendar/empty-calendar-state";
import {
  ServiceFilter,
  StaffFilter,
  StatusFilter,
} from "@/components/calendar/filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CalendarView } from "@/lib/calendar/labels";
import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import {
  formatCompactCount,
  formatHebrewDate,
  formatHebrewTime,
  isWithinRange,
  rangeForCalendarView,
  startOfDay,
  toDateInputValue,
} from "@/lib/calendar/utils";
import {
  listAppointmentsAction,
  listCalendarAvailableSlotsAction,
} from "@/server/actions/appointments";
import type { Service } from "@/server/repositories/services";
import type { StaffMember } from "@/server/repositories/staff-members";

/** Background refresh while the manager calendar tab is open. */
const CALENDAR_POLL_MS = 30_000;

const HIDDEN_BY_DEFAULT_STATUSES = new Set<CalendarAppointment["status"]>([
  "cancelled",
  "no_show",
]);

type CalendarManagerProps = {
  initialAppointments: CalendarAppointment[];
  initialAvailableSlots: CalendarAvailableSlot[];
  services: Service[];
  staff: StaffMember[];
  canManage: boolean;
};

function sortDateKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function CalendarManager({
  initialAppointments,
  initialAvailableSlots,
  services,
  staff,
  canManage,
}: CalendarManagerProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [availableSlots, setAvailableSlots] = useState(initialAvailableSlots);
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<CalendarView>("month");
  const [staffFilter, setStaffFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDateKeys, setSelectedDateKeys] = useState<string[]>([]);
  const [focusedDateKey, setFocusedDateKey] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [isPending, startTransition] = useTransition();

  const { from: rangeFrom, to: rangeTo } = useMemo(
    () => rangeForCalendarView(anchorDate, view),
    [anchorDate, view],
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (staffFilter && appointment.staff.id !== staffFilter) return false;
      if (serviceFilter && appointment.service.id !== serviceFilter) return false;
      if (statusFilter) {
        return appointment.status === statusFilter;
      }
      return !HIDDEN_BY_DEFAULT_STATUSES.has(appointment.status);
    });
  }, [appointments, staffFilter, serviceFilter, statusFilter]);

  const visibleAppointments = useMemo(() => {
    return filteredAppointments.filter((appointment) =>
      isWithinRange(appointment.startsAt, rangeFrom, rangeTo),
    );
  }, [filteredAppointments, rangeFrom, rangeTo]);

  const visibleSlots = useMemo(() => {
    return availableSlots.filter((slot) => isWithinRange(slot.startsAt, rangeFrom, rangeTo));
  }, [availableSlots, rangeFrom, rangeTo]);

  const availableSlotsByDate = useMemo(() => {
    return visibleSlots.reduce<Record<string, CalendarAvailableSlot[]>>((acc, slot) => {
      acc[slot.date] ??= [];
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [visibleSlots]);

  const focusedSlots = availableSlotsByDate[focusedDateKey] ?? [];
  const hasVisibleContent =
    visibleAppointments.length > 0 || visibleSlots.length > 0;

  const selectedCreateDate = selectedDateKeys.at(-1) ?? focusedDateKey;

  function focusDay(date: Date) {
    const key = toDateInputValue(date);
    setAnchorDate(startOfDay(date));
    setFocusedDateKey(key);
    setSelectedDateKeys((current) =>
      current.includes(key) ? current : sortDateKeys([...current, key]),
    );
  }

  function handleAnchorChange(date: Date) {
    const normalized = startOfDay(date);
    setAnchorDate(normalized);
    setFocusedDateKey(toDateInputValue(normalized));
  }

  function refreshCalendarData() {
    const { from, to } = rangeForCalendarView(anchorDate, view);
    startTransition(async () => {
      const [appointmentsResult, slotsResult] = await Promise.all([
        listAppointmentsAction({
          from: from.toISOString(),
          to: to.toISOString(),
          staffMemberId: staffFilter || undefined,
          serviceId: serviceFilter || undefined,
          status: statusFilter
            ? (statusFilter as CalendarAppointment["status"])
            : undefined,
        }),
        listCalendarAvailableSlotsAction({
          from: from.toISOString(),
          to: to.toISOString(),
          staffMemberId: staffFilter || undefined,
        }),
      ]);
      if (appointmentsResult.ok) setAppointments(appointmentsResult.appointments);
      else window.location.reload();
      if (slotsResult.ok) setAvailableSlots(slotsResult.slots);
      else setAvailableSlots([]);
    });
  }

  useEffect(() => {
    refreshCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, view, staffFilter, serviceFilter, statusFilter]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshCalendarData();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshCalendarData();
      }
    }, CALENDAR_POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, view, staffFilter, serviceFilter, statusFilter]);

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  const selectedAppointmentPreview = useMemo(
    () => appointments.find((row) => row.id === selectedId) ?? null,
    [appointments, selectedId],
  );

  const filterPanel = (
    <div className="grid gap-3 sm:grid-cols-3">
      <StaffFilter value={staffFilter} onChange={setStaffFilter} staff={staff} />
      <ServiceFilter
        value={serviceFilter}
        onChange={setServiceFilter}
        services={services}
      />
      <StatusFilter value={statusFilter} onChange={setStatusFilter} />
    </div>
  );

  const focusedAppointments = useMemo(() => {
    return filteredAppointments
      .filter(
        (appointment) =>
          toDateInputValue(new Date(appointment.startsAt)) === focusedDateKey,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [filteredAppointments, focusedDateKey]);

  const dayDetailPanel =
    view === "day" || view === "month" || view === "week" ? (
      <div className="space-y-4">
        {view !== "day" && focusedAppointments.length > 0 ? (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-on-surface">
                תורים — {formatHebrewDate(`${focusedDateKey}T12:00:00`)}
              </h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {focusedAppointments.length} תורים
              </span>
            </div>
            <div className="divide-y divide-outline-variant/15 rounded-lg border border-outline-variant/20">
              {focusedAppointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => openDetail(appointment.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start transition hover:bg-surface-container-low/80"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface">
                      {formatHebrewTime(appointment.startsAt)} · {appointment.customer.fullName}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {appointment.service.name}
                      {appointment.staff.name ? ` · ${appointment.staff.name}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-primary">פרטים</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {view === "day" || view === "month" || view === "week" ? (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-on-surface">
                {view === "day" ? "יום נבחר" : "סלוטים פנויים"} —{" "}
                {formatHebrewDate(`${focusedDateKey}T12:00:00`)}
              </h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {formatCompactCount(focusedSlots.length)} פנויים
              </span>
            </div>
            {focusedSlots.length === 0 ? (
              <p className="text-on-surface-variant">אין סלוטים פנויים לתאריך זה.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {focusedSlots.map((slot) => (
                  <div
                    key={`${slot.staffMemberId ?? "clinic"}-${slot.startsAt}`}
                    className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3"
                  >
                    <p className="font-medium text-on-surface">
                      {formatHebrewTime(slot.startsAt)}–{formatHebrewTime(slot.endsAt)}
                    </p>
                    <p className="text-xs text-on-surface-variant">פנוי</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DateNavigator
          anchorDate={anchorDate}
          view={view}
          onAnchorChange={handleAnchorChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <CalendarViewSwitcher value={view} onChange={setView} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="size-4" />
            סינון
          </Button>
          {canManage ? (
            <Button
              type="button"
              variant="cta"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              הוסף תור
            </Button>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">{filterPanel}</div>

      {isPending ? (
        <p className="text-sm text-on-surface-variant">טוען יומן...</p>
      ) : null}

      {!hasVisibleContent && !isPending ? (
        <EmptyCalendarState />
      ) : view === "list" ? (
        <CalendarScheduleListView
          appointments={visibleAppointments}
          availableSlots={visibleSlots}
          onSelectAppointment={openDetail}
        />
      ) : (
        <CalendarGridViews
          appointments={visibleAppointments}
          anchorDate={anchorDate}
          view={view}
          onSelect={openDetail}
          selectedDateKeys={selectedDateKeys}
          availableSlotsByDate={availableSlotsByDate}
          onDateSelect={focusDay}
        />
      )}

      {dayDetailPanel}

      {canManage ? (
        <Button
          type="button"
          variant="cta"
          size="lg"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] start-4 z-40 rounded-full shadow-purple-md md:bottom-6 md:start-6 md:hidden"
          onClick={() => setCreateOpen(true)}
          aria-label="הוסף תור"
        >
          <Plus className="size-5" />
          הוסף תור
        </Button>
      ) : null}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="end"
          className="max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:max-h-[70vh] max-md:max-w-none max-md:rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>סינון</SheetTitle>
            <SheetCloseButton />
          </SheetHeader>
          <SheetBody>{filterPanel}</SheetBody>
        </SheetContent>
      </Sheet>

      <AppointmentDetailDrawer
        appointmentId={selectedId}
        preview={selectedAppointmentPreview}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        services={services}
        staff={staff}
        onUpdated={refreshCalendarData}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="end"
          className="max-w-lg max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:max-h-[92vh] max-md:max-w-none max-md:rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>תור חדש</SheetTitle>
            <SheetCloseButton />
          </SheetHeader>
          <SheetBody>
            <AppointmentForm
              services={services}
              staff={staff}
              defaultDate={selectedCreateDate}
              onSuccess={() => {
                setCreateOpen(false);
                refreshCalendarData();
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
