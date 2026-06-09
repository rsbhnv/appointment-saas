"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AvailabilityDateEditor, mapSaveError } from "@/components/availability/availability-date-editor";
import {
  AvailabilityMonthGrid,
  type DateCellMeta,
} from "@/components/availability/availability-month-grid";
import { AvailabilitySchedulePanel } from "@/components/availability/availability-schedule-panel";
import { DateNavigator } from "@/components/calendar/date-navigator";
import {
  getDateAvailabilitySnapshot,
  snapshotsMatch,
} from "@/lib/availability/date-exceptions";
import {
  countAppointmentsByDate,
  countSlotsByDate,
} from "@/lib/availability/schedule-summary";
import {
  validateTimeRanges,
  type TimeRangeInput,
} from "@/lib/availability/ranges";
import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import {
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
} from "@/lib/calendar/utils";
import {
  listAppointmentsAction,
  listCalendarAvailableSlotsAction,
} from "@/server/actions/appointments";
import { saveDateAvailabilityAction } from "@/server/actions/availability";
import type { AvailabilityException } from "@/server/repositories/availability";
import type { StaffMember } from "@/server/repositories/staff-members";
import {
  resolveAvailabilityStaffScope,
  showAvailabilityStaffSelector,
  soleActiveStaffMemberId,
} from "@/lib/availability/staff-scope";

type AvailabilityCalendarTabProps = {
  exceptions: AvailabilityException[];
  staff: StaffMember[];
  canManage: boolean;
  initialAppointments: CalendarAppointment[];
  initialAvailableSlots: CalendarAvailableSlot[];
};

const DEFAULT_RANGE: TimeRangeInput = { start_time: "09:00", end_time: "13:00" };

function sortDateKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function monthRange(anchorDate: Date): { from: Date; to: Date } {
  return {
    from: startOfWeek(startOfMonth(anchorDate)),
    to: endOfWeek(endOfMonth(anchorDate)),
  };
}

export function AvailabilityCalendarTab({
  exceptions,
  staff,
  canManage,
  initialAppointments,
  initialAvailableSlots,
}: AvailabilityCalendarTabProps) {
  const router = useRouter();
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [ranges, setRanges] = useState<TimeRangeInput[]>([DEFAULT_RANGE]);
  const [closed, setClosed] = useState(false);
  const [staffMemberId, setStaffMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [availableSlots, setAvailableSlots] = useState(initialAvailableSlots);
  const [isPending, startTransition] = useTransition();
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const soleStaffId = useMemo(() => soleActiveStaffMemberId(staff), [staff]);
  const showStaffSelector = useMemo(
    () => showAvailabilityStaffSelector(staff),
    [staff],
  );
  const effectiveStaffId = soleStaffId ?? staffMemberId;
  const staffScope = resolveAvailabilityStaffScope(staffMemberId, soleStaffId);

  const refreshSchedule = useCallback(() => {
    const { from, to } = monthRange(anchorDate);
    setScheduleLoading(true);
    startTransition(async () => {
      const [appointmentsResult, slotsResult] = await Promise.all([
        listAppointmentsAction({
          from: from.toISOString(),
          to: to.toISOString(),
          staffMemberId: effectiveStaffId || undefined,
        }),
        listCalendarAvailableSlotsAction({
          from: from.toISOString(),
          to: to.toISOString(),
          staffMemberId: effectiveStaffId || undefined,
        }),
      ]);
      if (appointmentsResult.ok) setAppointments(appointmentsResult.appointments);
      if (slotsResult.ok) setAvailableSlots(slotsResult.slots);
      setScheduleLoading(false);
    });
  }, [anchorDate, effectiveStaffId]);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  const appointmentCounts = useMemo(
    () => countAppointmentsByDate(appointments, effectiveStaffId),
    [appointments, effectiveStaffId],
  );

  const slotCounts = useMemo(
    () => countSlotsByDate(availableSlots, effectiveStaffId),
    [availableSlots, effectiveStaffId],
  );

  const dateMeta = useMemo(() => {
    const meta: Record<string, DateCellMeta> = {};
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const key = toDateInputValue(d);
      const snapshot = getDateAvailabilitySnapshot(exceptions, key, staffScope);
      const appointmentCount = appointmentCounts[key] ?? 0;
      const slotCount = slotCounts[key] ?? 0;
      if (
        snapshot.hasDateSpecific ||
        appointmentCount > 0 ||
        slotCount > 0
      ) {
        meta[key] = {
          hasDateSpecific: snapshot.hasDateSpecific,
          closed: snapshot.closed,
          rangeCount: snapshot.ranges.length,
          appointmentCount,
          slotCount,
        };
      }
    }
    return meta;
  }, [anchorDate, exceptions, staffScope, appointmentCounts, slotCounts]);

  const mixedSelection = useMemo(() => {
    if (selectedDates.length <= 1) return false;
    const snapshots = selectedDates.map((date) =>
      getDateAvailabilitySnapshot(exceptions, date, staffScope),
    );
    const first = snapshots[0]!;
    return !snapshots.every((snapshot) => snapshotsMatch(snapshot, first));
  }, [selectedDates, exceptions, staffScope]);

  useEffect(() => {
    if (selectedDates.length === 0) {
      setRanges([DEFAULT_RANGE]);
      setClosed(false);
      return;
    }
    const snapshots = selectedDates.map((date) =>
      getDateAvailabilitySnapshot(exceptions, date, staffScope),
    );
    const first = snapshots[0]!;
    const allSame = snapshots.every((snapshot) => snapshotsMatch(snapshot, first));
    if (!allSame) return;
    setClosed(first.closed);
    setRanges(
      first.closed || first.ranges.length === 0
        ? [DEFAULT_RANGE]
        : first.ranges.map((range) => ({ ...range })),
    );
  }, [selectedDates, staffScope, exceptions]);

  function toggleDate(day: Date) {
    const key = toDateInputValue(day);
    setError(null);
    setSelectedDates((current) =>
      current.includes(key)
        ? current.filter((date) => date !== key)
        : sortDateKeys([...current, key]),
    );
  }

  function handleStaffChange(value: string) {
    setStaffMemberId(value);
    setSelectedDates([]);
    setRanges([DEFAULT_RANGE]);
    setClosed(false);
    setError(null);
  }

  function afterSave() {
    router.refresh();
    refreshSchedule();
  }

  function save() {
    if (selectedDates.length === 0) return;
    setError(null);
    if (!closed) {
      const validated = validateTimeRanges(ranges);
      if (!validated.ok) {
        setError(
          mapSaveError(
            validated.error === "overlap"
              ? "ranges_overlap"
              : validated.error === "invalid_order"
                ? "invalid_time_order"
                : "empty_ranges",
          ),
        );
        return;
      }
    }
    startTransition(async () => {
      const result = await saveDateAvailabilityAction({
        dates: selectedDates,
        staff_member_id: staffScope,
        closed,
        ranges: closed ? [] : ranges,
      });
      if (!result.ok) {
        setError(mapSaveError(result.error));
        return;
      }
      afterSave();
    });
  }

  function closeSelectedDaysRemoveFreeSlots() {
    if (selectedDates.length === 0) return;
    const count = selectedDates.reduce((total, date) => {
      return (
        total +
        availableSlots.filter((row) => {
          if (row.date !== date) return false;
          if (effectiveStaffId && row.staffMemberId !== effectiveStaffId) return false;
          return true;
        }).length
      );
    }, 0);
    if (
      !window.confirm(
        `לסגור ${selectedDates.length} ימים?\n` +
          `יוסרו כ-${count} סלוטים פנויים (לא יוצגו ביומן). תורים תפוסים יישארו — בטלו אותם בנפרד.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveDateAvailabilityAction({
        dates: selectedDates,
        staff_member_id: staffScope,
        closed: true,
        ranges: [],
      });
      if (!result.ok) {
        setError(mapSaveError(result.error));
        return;
      }
      setClosed(true);
      afterSave();
    });
  }

  function useWeekly() {
    if (selectedDates.length === 0) return;
    if (!window.confirm("להסיר זמינות לפי תאריך ולחזור לשעות השבועיות?")) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDateAvailabilityAction({
        dates: selectedDates,
        staff_member_id: staffScope,
        use_weekly_schedule: true,
        closed: false,
        ranges: [],
      });
      if (!result.ok) {
        setError(mapSaveError(result.error));
        return;
      }
      setSelectedDates([]);
      afterSave();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(18rem,22rem)]">
        <div className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <DateNavigator
            anchorDate={anchorDate}
            view="month"
            onAnchorChange={(date) => setAnchorDate(startOfDay(date))}
          />
          <p className="text-xs text-on-surface-variant">
            לחצו על ימים לבחירה. תורים (כחול) וסלוטים פנויים (ירוק) מוצגים בלוח ובפאנל
            למטה.
          </p>
          {scheduleLoading ? (
            <p className="text-xs text-on-surface-variant">טוען תורים וסלוטים...</p>
          ) : null}
          <AvailabilityMonthGrid
            anchorDate={anchorDate}
            selectedDates={new Set(selectedDates)}
            dateMeta={dateMeta}
            onToggleDate={toggleDate}
            disabled={!canManage}
          />
        </div>

        <AvailabilityDateEditor
          selectedDates={selectedDates}
          ranges={ranges}
          closed={closed}
          staffMemberId={staffMemberId}
          staff={staff}
          showStaffSelector={showStaffSelector}
          canManage={canManage}
          isPending={isPending}
          error={error}
          mixedSelection={mixedSelection}
          onRangesChange={setRanges}
          onClosedChange={setClosed}
          onStaffChange={handleStaffChange}
          onSave={save}
          onUseWeekly={useWeekly}
          onAddRange={() =>
            setRanges((current) => [
              ...current,
              { start_time: "15:00", end_time: "17:00" },
            ])
          }
          onRemoveRange={(index) =>
            setRanges((current) => current.filter((_, i) => i !== index))
          }
        />
      </div>

      <AvailabilitySchedulePanel
        selectedDates={selectedDates}
        appointments={appointments}
        availableSlots={availableSlots}
        canManage={canManage}
        staffMemberId={effectiveStaffId}
        closeDaysPending={isPending}
        onCloseSelectedDays={closeSelectedDaysRemoveFreeSlots}
        onScheduleChange={() => {
          router.refresh();
          refreshSchedule();
        }}
      />
    </div>
  );
}
