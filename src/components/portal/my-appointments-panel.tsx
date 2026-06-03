"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, CalendarCheck } from "lucide-react";

import { BusinessBookingHeader } from "@/components/portal/business-booking-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCancellableAppointmentIds } from "@/lib/booking/customer-cancellation";
import { formatHebrewDate, formatHebrewTime } from "@/lib/calendar/utils";
import { customerBookingPath } from "@/lib/tenant/customer-portal-paths";
import {
  portalAppointmentCard,
  portalBtnPrimary,
  portalCancelBtn,
  portalCard,
  portalCardInner,
  portalSectionSubtitle,
  portalSectionTitle,
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
  not_found: "לא נמצאו תורים לטלפון זה.",
  cancellation_not_allowed: "ביטול על ידי לקוח אינו מותר.",
  cancellation_too_late: "לא ניתן לבטל — עבר מועד הביטול.",
  cannot_cancel: "לא ניתן לבטל תור זה.",
  unknown: "אירעה שגיאה. נסה/י שוב.",
};

type MyAppointmentsPanelProps = {
  businessSlug: string;
  businessName: string;
  businessDescription?: string | null;
  logoUrl?: string | null;
  serviceNames: Record<string, string>;
  settings: CustomerBookingSettings;
};

export function MyAppointmentsPanel({
  businessSlug,
  businessName,
  businessDescription,
  logoUrl,
  serviceNames,
  settings,
}: MyAppointmentsPanelProps) {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const cancellableIds = getCancellableAppointmentIds(appointments, settings);

  function loadAppointments() {
    setError(null);
    setSuccess(null);
    const trimmed = phone.trim();
    if (!trimmed) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    startTransition(async () => {
      const result = await lookupCustomerAppointmentsAction({
        businessSlug,
        phone: trimmed,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setAppointments(result.appointments);
      setLoaded(true);
    });
  }

  function submitCancel(appointmentId: string) {
    setError(null);
    if (!cancelReason.trim() || !phone.trim()) {
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
    });
  }

  return (
    <div className="space-y-6">
      <BusinessBookingHeader
        name={businessName}
        description={businessDescription}
        logoUrl={logoUrl}
        subtitle="התורים שלי"
      />

      <div className={cn(portalCard, portalCardInner, "space-y-5")}>
        <div className="space-y-1">
          <h2 className={cn(portalSectionTitle, "flex items-center gap-2 text-lg sm:text-xl")}>
            <CalendarCheck className="size-5 text-primary" />
            חיפוש לפי טלפון
          </h2>
          <p className={portalSectionSubtitle}>הזינ/י את מספר הטלפון שאיתו נקבעו התורים</p>
        </div>
        <Field label="טלפון נייד" htmlFor="my-phone">
          <Input
            id="my-phone"
            type="tel"
            inputMode="tel"
            placeholder="050-1234567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setLoaded(false);
            }}
          />
        </Field>
        <Button
          type="button"
          variant="cta"
          size="xl"
          className={portalBtnPrimary}
          disabled={isPending}
          onClick={loadAppointments}
        >
          הצג תורים
        </Button>
      </div>

      {loaded && appointments.length === 0 ? (
        <p className="text-center text-sm text-on-surface-variant">לא נמצאו תורים לטלפון זה.</p>
      ) : null}

      {appointments.length > 0 ? (
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
        </div>
      ) : null}

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

      <div className="text-center">
        <Link
          href={customerBookingPath(businessSlug)}
          className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          <ArrowRight className="size-4 rotate-180" />
          חזרה לקביעת תור
        </Link>
      </div>
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
