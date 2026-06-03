"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CustomerSelectOrCreate } from "@/components/calendar/customer-select-or-create";
import {
  createManualAppointmentAction,
  getAvailableSlotsForAdminAction,
  updateAppointmentAction,
} from "@/server/actions/appointments";
import type { CalendarAppointment } from "@/lib/calendar/types";
import type { Service } from "@/server/repositories/services";
import type { StaffMember } from "@/server/repositories/staff-members";
import { formatHebrewTime, toDateInputValue } from "@/lib/calendar/utils";
import type { AppointmentStatus } from "@/types/database";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  slot_unavailable: "השעה תפוסה או מחוץ לשעות הפעילות.",
  customer_not_found: "הלקוח לא נמצא.",
  service_not_found: "השירות לא פעיל או לא נמצא — בחרו שירות מהרשימה.",
  staff_not_found: "איש הצוות לא נמצא.",
  unknown: "לא הצלחנו לשמור את התור.",
};

const SLOTS_ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים — בחרו שירות, איש צוות ותאריך.",
  service_not_found: "השירות שנבחר אינו פעיל. בחרו שירות אחר מהרשימה.",
  staff_not_found: "איש הצוות שנבחר אינו פעיל.",
  forbidden: "אין הרשאה לטעון שעות.",
  unknown: "לא ניתן לטעון שעות. נסו שוב בעוד רגע.",
};

type AppointmentFormProps = {
  services: Service[];
  staff: StaffMember[];
  initial?: CalendarAppointment | null;
  defaultDate?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function AppointmentForm({
  services,
  staff,
  initial = null,
  defaultDate,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const [customerId, setCustomerId] = useState(initial?.customer.id ?? "");
  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services],
  );
  const activeStaff = useMemo(() => staff.filter((member) => member.active), [staff]);

  const [serviceId, setServiceId] = useState(() => {
    if (initial?.service.id && services.some((s) => s.id === initial.service.id && s.active)) {
      return initial.service.id;
    }
    return activeServices[0]?.id ?? "";
  });
  const [staffMemberId, setStaffMemberId] = useState(
    initial?.staff.id ?? activeStaff[0]?.id ?? "",
  );
  const [date, setDate] = useState(
    initial
      ? toDateInputValue(new Date(initial.startsAt))
      : (defaultDate ?? toDateInputValue(new Date())),
  );
  const [selectedSlot, setSelectedSlot] = useState(initial?.startsAt ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(initial?.internalNotes ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(initial?.status ?? "confirmed");
  const [slots, setSlots] = useState<Array<{ startsAt: string; endsAt: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsHint, setSlotsHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (serviceId && activeServices.some((service) => service.id === serviceId)) {
      return;
    }
    setServiceId(activeServices[0]?.id ?? "");
  }, [activeServices, serviceId]);

  useEffect(() => {
    if (staffMemberId && activeStaff.some((member) => member.id === staffMemberId)) {
      return;
    }
    setStaffMemberId(activeStaff[0]?.id ?? "");
  }, [activeStaff, staffMemberId]);

  const displaySlots =
    serviceId && staffMemberId && date ? slots : [];

  useEffect(() => {
    if (!initial && defaultDate) setDate(defaultDate);
  }, [defaultDate, initial]);

  useEffect(() => {
    if (!serviceId || !staffMemberId || !date) {
      setSlots([]);
      setSlotsHint(null);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsHint(null);
    setSlots([]);

    void (async () => {
      const result = await getAvailableSlotsForAdminAction({
        serviceId,
        staffMemberId,
        date,
        excludeAppointmentId: initial?.id,
      });
      if (cancelled) return;
      setSlotsLoading(false);
      if (result.ok) {
        setSlots(result.slots);
        setSelectedSlot((current) =>
          result.slots.some((slot) => slot.startsAt === current)
            ? current
            : (result.slots[0]?.startsAt ?? ""),
        );
        if (result.slots.length === 0) {
          setSlotsHint(
            "אין שעות פנויות — ייתכן שהיום סגור בזמינות, שכל השעות תפוסות, או שמשך השירות ארוך מטווחי העבודה.",
          );
        }
      } else {
        setSlotsHint(SLOTS_ERROR_COPY[result.error] ?? SLOTS_ERROR_COPY.unknown);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceId, staffMemberId, date, initial?.id]);

  function submit() {
    setError(null);
    if (!customerId || !serviceId || !staffMemberId || !selectedSlot) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    const payload = {
      customerId,
      serviceId,
      staffMemberId,
      startsAt: selectedSlot,
      notes: notes || null,
      internalNotes: internalNotes || null,
      status,
      ...(initial ? { id: initial.id } : {}),
    };

    startTransition(async () => {
      const result = initial
        ? await updateAppointmentAction(payload)
        : await createManualAppointmentAction(payload);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="space-y-5">
      {!initial ? (
        <CustomerSelectOrCreate
          selectedCustomerId={customerId}
          onSelect={setCustomerId}
        />
      ) : (
        <div className="rounded-lg border border-outline-variant/30 p-3 text-sm">
          <p className="font-medium">{initial.customer.fullName}</p>
          <p className="text-on-surface-variant">
            {[initial.customer.phone, initial.customer.email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}

      <Field label="שירות">
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
        >
          {activeServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} דק׳)
            </option>
          ))}
        </select>
      </Field>

      <Field label="איש צוות">
        <select
          value={staffMemberId}
          onChange={(e) => setStaffMemberId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
        >
          {activeStaff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="תאריך">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <Field label="שעה פנויה">
        {slotsLoading ? (
          <p className="text-sm text-on-surface-variant">טוען שעות פנויות...</p>
        ) : displaySlots.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {slotsHint ?? "אין שעות פנויות בתאריך זה. נסו תאריך אחר."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displaySlots.map((slot) => {
              const time = formatHebrewTime(slot.startsAt);
              return (
                <Button
                  key={slot.startsAt}
                  type="button"
                  size="sm"
                  variant={selectedSlot === slot.startsAt ? "cta" : "outline"}
                  onClick={() => setSelectedSlot(slot.startsAt)}
                >
                  {time}
                </Button>
              );
            })}
          </div>
        )}
      </Field>

      <Field label="הערות ללקוח">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="flex min-h-20 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm"
        />
      </Field>

      <Field label="הערה פנימית">
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className="flex min-h-20 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm"
        />
      </Field>

      <Field label="סטטוס">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
          className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
        >
          <option value="pending">ממתין לאישור</option>
          <option value="confirmed">מאושר</option>
          <option value="completed">הושלם</option>
          <option value="cancelled">בוטל</option>
          <option value="no_show">לא הגיע</option>
        </select>
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="cta" disabled={isPending} onClick={submit}>
          {isPending ? "שומר..." : initial ? "עדכון תור" : "שמירת תור"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
