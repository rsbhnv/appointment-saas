"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarCheck, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCancellableAppointmentIds } from "@/lib/booking/customer-cancellation";
import { toDateInputValue } from "@/lib/calendar/utils";
import {
  bookCustomerAppointment,
  cancelCustomerAppointment,
  getAvailableSlotsForCustomerAction,
  lookupCustomerAppointmentsAction,
} from "@/server/actions/customer-booking";
import type { Appointment } from "@/server/repositories/appointments";
import type { Service } from "@/server/repositories/services";
import type { StaffMember } from "@/server/repositories/staff-members";
import type { CustomerBookingSettings } from "@/components/portal/booking-types";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים. בדוק/י את השדות.",
  invalid_time: "יש לבחור תאריך ושעה עתידיים.",
  service_not_found: "השירות לא נמצא.",
  staff_not_found: "איש הצוות לא נמצא.",
  business_not_found: "העסק לא נמצא.",
  slot_unavailable: "השעה תפוסה. בחר/י זמן אחר.",
  outside_booking_window: "התאריך מחוץ לחלון ההזמנה.",
  too_soon: "יש להזמין מראש לפי מדיניות העסק.",
  daily_limit_reached: "הגעת למכסת התורים ליום זה.",
  cancellation_not_allowed: "ביטול על ידי לקוח אינו מותר.",
  cancellation_too_late: "לא ניתן לבטל — עבר מועד הביטול.",
  cannot_cancel: "לא ניתן לבטל תור זה.",
  not_found: "לא נמצאו תורים לטלפון זה.",
  booking_unavailable: "הזמנה אינה זמינה כרגע. נסו שוב מאוחר יותר.",
  unknown: "לא הצלחנו לשמור את התור. נסה/י שוב.",
};

type CustomerBookingPanelProps = {
  businessSlug: string;
  businessName: string;
  services: Service[];
  staff: StaffMember[];
  serviceNames: Record<string, string>;
  settings: CustomerBookingSettings;
};

export function CustomerBookingPanel({
  businessSlug,
  businessName,
  services,
  staff,
  serviceNames,
  settings,
}: CustomerBookingPanelProps) {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id ?? "");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<Array<{ startsAt: string; endsAt: string }>>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const cancellableAppointmentIds = useMemo(
    () => getCancellableAppointmentIds(myAppointments, settings),
    [myAppointments, settings],
  );
  const cancellableSet = useMemo(
    () => new Set(cancellableAppointmentIds),
    [cancellableAppointmentIds],
  );

  const maxDate = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + settings.bookingWindowDays);
    return toDateInputValue(end);
  }, [settings.bookingWindowDays]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  useEffect(() => {
    if (!selectedServiceId || !selectedStaffId || !date) return;

    startTransition(async () => {
      const result = await getAvailableSlotsForCustomerAction({
        businessSlug,
        serviceId: selectedServiceId,
        staffMemberId: selectedStaffId,
        date,
      });
      if (result.ok) {
        setSlots(result.slots);
        setSelectedSlot((current) =>
          result.slots.some((slot) => slot.startsAt === current)
            ? current
            : (result.slots[0]?.startsAt ?? ""),
        );
      } else {
        setSlots([]);
        setSelectedSlot("");
      }
    });
  }, [businessSlug, selectedServiceId, selectedStaffId, date]);

  function loadMyAppointments() {
    setError(null);
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    startTransition(async () => {
      const result = await lookupCustomerAppointmentsAction({
        businessSlug,
        phone: trimmedPhone,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setMyAppointments(result.appointments);
      setAppointmentsLoaded(true);
      if (result.customerName && !fullName.trim()) {
        setFullName(result.customerName);
      }
    });
  }

  function submitBooking() {
    setError(null);
    setSuccess(null);
    const trimmedPhone = phone.trim();
    if (
      !selectedServiceId ||
      !selectedStaffId ||
      !date ||
      !selectedSlot ||
      !fullName.trim() ||
      !trimmedPhone
    ) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    startTransition(async () => {
      const result = await bookCustomerAppointment({
        businessSlug,
        serviceId: selectedServiceId,
        staffMemberId: selectedStaffId,
        startsAt: selectedSlot,
        fullName: fullName.trim(),
        phone: trimmedPhone,
        notes: notes.trim() || null,
      });

      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }

      setSuccess("התור נקבע ואושר בהצלחה!");
      setNotes("");
      loadMyAppointments();
    });
  }

  function submitCancel(appointmentId: string) {
    setError(null);
    const trimmedPhone = phone.trim();
    if (!cancelReason.trim() || !trimmedPhone) {
      setError(ERROR_COPY.invalid_input);
      return;
    }
    startTransition(async () => {
      const result = await cancelCustomerAppointment({
        businessSlug,
        appointmentId,
        phone: trimmedPhone,
        cancellationReason: cancelReason.trim(),
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setCancelTargetId(null);
      setCancelReason("");
      setSuccess("התור בוטל בהצלחה.");
      loadMyAppointments();
    });
  }

  if (services.length === 0 || staff.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>הזמנת תור</CardTitle>
          <CardDescription>
            {services.length === 0
              ? "מנהלת העסק עדיין לא הוסיפה שירותים."
              : "מנהלת העסק עדיין לא הוסיפה אנשי צוות."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-sm text-on-surface-variant">
          חזר/י מאוחר יותר או צר/י קשר ישירות עם {businessName}.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-5" aria-hidden />
            הזיהוי שלי
          </CardTitle>
          <CardDescription>
            הזינ/י את מספר הטלפון שלכם לצפייה בתורים וקביעת תור חדש
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <Field label="טלפון נייד" htmlFor="booking-phone" className="min-w-[12rem] flex-1">
            <Input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setAppointmentsLoaded(false);
              }}
              required
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !phone.trim()}
            onClick={loadMyAppointments}
          >
            הצג תורים שלי
          </Button>
        </CardContent>
      </Card>

      {appointmentsLoaded && myAppointments.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="size-5" aria-hidden />
              התורים שלי
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-outline-variant/20 p-0">
            {myAppointments.map((appt) => (
              <div key={appt.id} className="space-y-3 px-6 py-4 text-sm">
                <div>
                  <p className="font-medium text-on-surface">
                    {serviceNames[appt.service_id] ?? "שירות"}
                  </p>
                  <p className="text-on-surface-variant">
                    {formatWhen(appt.starts_at)} ·{" "}
                    <Badge variant="outline">{statusLabel(appt.status)}</Badge>
                  </p>
                </div>
                {cancellableSet.has(appt.id) ? (
                  cancelTargetId === appt.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="סיבת ביטול (חובה)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => submitCancel(appt.id)}
                        >
                          אישור ביטול
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCancelTargetId(null);
                            setCancelReason("");
                          }}
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCancelTargetId(appt.id);
                        setCancelReason("");
                        setError(null);
                      }}
                    >
                      ביטול תור
                    </Button>
                  )
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : appointmentsLoaded ? (
        <p className="text-center text-sm text-on-surface-variant">
          לא נמצאו תורים עתידיים לטלפון זה.
        </p>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>קביעת תור חדש</CardTitle>
          <CardDescription>
            בחר/י שירות, איש צוות ושעה פנויה — לפי זמינות העסק
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6">
          <Field label="שירות" htmlFor="booking-service">
            <select
              id="booking-service"
              className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.duration_minutes} דק׳ · ₪{service.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="איש/אשת צוות" htmlFor="booking-staff">
            <select
              id="booking-staff"
              className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.title ? ` · ${member.title}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="תאריך" htmlFor="booking-date">
            <Input
              id="booking-date"
              type="date"
              value={date}
              min={toDateInputValue(new Date())}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>

          <Field label="שעה פנויה">
            {slots.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                אין שעות פנויות בתאריך זה. נסו תאריך אחר.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const time = new Intl.DateTimeFormat("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(slot.startsAt));
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

          <Field label="שם מלא" htmlFor="booking-name">
            <Input
              id="booking-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>

          <Field label="הערות (אופציונלי)" htmlFor="booking-notes">
            <Input
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          {selectedService ? (
            <p className="text-xs text-on-surface-variant">
              משך {selectedService.duration_minutes} דקות
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-primary" role="status">
              {success}
            </p>
          ) : null}

          <Button
            type="button"
            variant="cta"
            disabled={isPending || !selectedSlot || !phone.trim()}
            onClick={submitBooking}
          >
            {isPending ? "שומר..." : "קביעת תור"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "ממתין",
    confirmed: "מאושר",
    cancelled: "בוטל",
    completed: "הושלם",
    no_show: "לא הגיע/ה",
  };
  return map[status] ?? status;
}
