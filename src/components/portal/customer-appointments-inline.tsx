"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCancellableAppointmentIds } from "@/lib/booking/customer-cancellation";
import { formatHebrewDate, formatHebrewTime } from "@/lib/calendar/utils";
import {
  portalAppointmentCard,
  portalCancelBtn,
  portalCard,
  portalCardInner,
  portalStatusConfirmed,
  portalStatusMuted,
} from "@/lib/portal/styles";
import {
  cancelCustomerAppointment,
  lookupCustomerAppointmentsAction,
} from "@/server/actions/customer-booking";
import type { Appointment } from "@/server/repositories/appointments";
import type { CustomerBookingSettings } from "@/components/portal/booking-types";
import { cn } from "@/lib/utils";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  not_found: "לא נמצאו תורים.",
  cancellation_not_allowed: "ביטול על ידי לקוח אינו מותר.",
  cancellation_too_late: "לא ניתן לבטל — עבר מועד הביטול.",
  cannot_cancel: "לא ניתן לבטל תור זה.",
  unknown: "אירעה שגיאה. נסו שוב.",
};

type CustomerAppointmentsInlineProps = {
  businessSlug: string;
  phone: string;
  serviceNames: Record<string, string>;
  settings: CustomerBookingSettings;
  onAppointmentsChange?: () => void;
};

export function CustomerAppointmentsInline({
  businessSlug,
  phone,
  serviceNames,
  settings,
  onAppointmentsChange,
}: CustomerAppointmentsInlineProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const cancellableIds = getCancellableAppointmentIds(appointments, settings);

  function loadAppointments() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    void (async () => {
      const result = await lookupCustomerAppointmentsAction({
        businessSlug,
        phone: phone.trim(),
      });
      setLoading(false);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        setAppointments([]);
        return;
      }
      setAppointments(result.appointments);
    })();
  }

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessSlug, phone]);

  function submitCancel(appointmentId: string) {
    setError(null);
    if (!cancelReason.trim()) {
      setError(ERROR_COPY.invalid_input);
      return;
    }
    startTransition(async () => {
      const result = await cancelCustomerAppointment({
        businessSlug,
        appointmentId,
        phone: phone.trim(),
        cancellationReason: cancelReason.trim(),
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setCancelTargetId(null);
      setCancelReason("");
      setSuccess("התור בוטל בהצלחה.");
      loadAppointments();
      onAppointmentsChange?.();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-on-surface-variant">
        <Loader2 className="size-4 animate-spin" />
        טוען תורים...
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className={cn(portalCard, portalCardInner, "border-dashed text-center")}>
        <CalendarCheck className="mx-auto size-10 text-on-surface-variant/50" />
        <p className="mt-3 text-sm text-on-surface-variant">אין תורים עתידיים.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appt) => (
        <article key={appt.id} className={portalAppointmentCard}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-base font-bold text-on-surface">
              {serviceNames[appt.service_id] ?? "שירות"}
            </p>
            <StatusBadge status={appt.status} />
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">
            {formatHebrewDate(appt.starts_at)} · {formatHebrewTime(appt.starts_at)}
          </p>

          {cancellableIds.includes(appt.id) ? (
            cancelTargetId === appt.id ? (
              <div className="mt-4 space-y-3 border-t border-outline-variant/15 pt-4">
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
                    className="rounded-full"
                    disabled={isPending}
                    onClick={() => submitCancel(appt.id)}
                  >
                    אישור ביטול
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
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
                className={cn(portalCancelBtn, "mt-4 w-full sm:w-auto")}
                onClick={() => {
                  setCancelTargetId(appt.id);
                  setCancelReason("");
                }}
              >
                ביטול תור
              </Button>
            )
          ) : null}
        </article>
      ))}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm font-medium text-primary" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabel(status);
  const confirmed = status === "confirmed" || status === "pending";

  return (
    <span className={confirmed ? portalStatusConfirmed : portalStatusMuted}>{label}</span>
  );
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
