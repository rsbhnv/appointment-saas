"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";
import { AppointmentCustomerSummary } from "@/components/calendar/appointment-customer-summary";
import { AppointmentForm } from "@/components/calendar/appointment-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PAYMENT_STATUS_LABELS } from "@/lib/calendar/labels";
import { formatHebrewDateTime } from "@/lib/calendar/utils";
import {
  cancelAppointmentAction,
  changeAppointmentStatusAction,
  getAppointmentByIdAction,
} from "@/server/actions/appointments";
import type {
  CalendarAppointment,
  CalendarAppointmentDetail,
} from "@/lib/calendar/types";
import type { Service } from "@/server/repositories/services";
import type { StaffMember } from "@/server/repositories/staff-members";
import type { AppointmentStatus } from "@/types/database";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  not_found: "התור לא נמצא.",
  unknown: "אירעה שגיאה.",
};

type AppointmentDetailDrawerProps = {
  appointmentId: string | null;
  /** Already loaded in the calendar — shown instantly while the server refreshes. */
  preview?: CalendarAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  staff: StaffMember[];
  onUpdated: () => void;
};

function toDetailPreview(row: CalendarAppointment): CalendarAppointmentDetail {
  return { ...row, auditEvents: [] };
}

export function AppointmentDetailDrawer({
  appointmentId,
  preview,
  open,
  onOpenChange,
  services,
  staff,
  onUpdated,
}: AppointmentDetailDrawerProps) {
  const [detail, setDetail] = useState<CalendarAppointmentDetail | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "cancel">("view");
  const [cancelReason, setCancelReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loadGenerationRef = useRef(0);

  function applyDetail(next: CalendarAppointmentDetail) {
    setDetail(next);
    setInternalNote(next.internalNotes ?? "");
  }

  function loadDetail(
    id: string,
    options?: { silent?: boolean; keepOnError?: boolean },
  ) {
    const generation = ++loadGenerationRef.current;
    if (!options?.silent) setIsRefreshing(true);
    startTransition(async () => {
      const result = await getAppointmentByIdAction({ id });
      if (generation !== loadGenerationRef.current) return;
      setIsRefreshing(false);
      if (result.ok) {
        applyDetail(result.appointment);
        setError(null);
        return;
      }
      if (!options?.keepOnError) {
        setDetail(null);
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
      }
    });
  }

  useEffect(() => {
    if (!open || !appointmentId) {
      if (!open) {
        loadGenerationRef.current += 1;
        setDetail(null);
        setMode("view");
        setError(null);
        setIsRefreshing(false);
      }
      return;
    }

    setMode("view");
    setError(null);

    const hasPreview = preview?.id === appointmentId;
    if (hasPreview) {
      applyDetail(toDetailPreview(preview));
    } else {
      setDetail(null);
    }

    loadDetail(appointmentId, { silent: hasPreview, keepOnError: hasPreview });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch only when opening or switching appointment
  }, [open, appointmentId]);

  useEffect(() => {
    if (!open || !appointmentId || preview?.id !== appointmentId) return;
    setDetail((current) => {
      const next = toDetailPreview(preview);
      if (!current || current.id !== appointmentId) return next;
      return { ...next, auditEvents: current.auditEvents };
    });
    setInternalNote(preview.internalNotes ?? "");
  }, [open, appointmentId, preview]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function changeStatus(status: AppointmentStatus) {
    if (!detail) return;
    setError(null);
    startTransition(async () => {
      const result = await changeAppointmentStatusAction({
        id: detail.id,
        status,
        internalNotes: internalNote || null,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      onUpdated();
      loadDetail(detail.id);
    });
  }

  function submitCancel() {
    if (!detail || !cancelReason.trim()) {
      setError(ERROR_COPY.invalid_input);
      return;
    }
    startTransition(async () => {
      const result = await cancelAppointmentAction({
        id: detail.id,
        cancellationReason: cancelReason.trim(),
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      onUpdated();
      onOpenChange(false);
    });
  }

  const reminderLabel = detail
    ? [
        detail.customer.smsConsent ? "SMS" : null,
        detail.customer.whatsappConsent ? "WhatsApp" : null,
        detail.customer.emailConsent ? "אימייל" : null,
      ]
        .filter(Boolean)
        .join(", ") || "לא הוגדר"
    : "";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="end"
        className="max-w-md max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:max-h-[90vh] max-md:max-w-none max-md:rounded-t-xl"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "edit"
              ? "עריכת תור"
              : mode === "cancel"
                ? "ביטול תור"
                : "פרטי תור"}
          </SheetTitle>
          <SheetCloseButton />
        </SheetHeader>
        <SheetBody>
          {!detail ? (
            <p className="text-sm text-on-surface-variant" role="status">
              טוען פרטי תור...
            </p>
          ) : mode === "edit" ? (
            <AppointmentForm
              services={services}
              staff={staff}
              initial={detail}
              onSuccess={() => {
                onUpdated();
                setMode("view");
                loadDetail(detail.id);
              }}
              onCancel={() => setMode("view")}
            />
          ) : mode === "cancel" ? (
            <div className="space-y-4">
              <FieldTextarea
                label="סיבת ביטול"
                value={cancelReason}
                onChange={setCancelReason}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={submitCancel}
                >
                  {isPending ? "מבטל..." : "אישור ביטול"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setMode("view")}>
                  חזרה
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <AppointmentStatusBadge status={detail.status} />
                {detail.paymentStatus ? (
                  <span className="text-xs text-on-surface-variant">
                    {PAYMENT_STATUS_LABELS[detail.paymentStatus]}
                  </span>
                ) : (
                  <span className="text-xs text-on-surface-variant">ללא תשלום</span>
                )}
              </div>

              <DetailSection title="לקוח">
                <AppointmentCustomerSummary customer={detail.customer} showName />
              </DetailSection>

              <DetailSection title="שירות וצוות">
                <p>{detail.service.name}</p>
                <p className="text-sm text-on-surface-variant">{detail.staff.name}</p>
              </DetailSection>

              <DetailSection title="מועד">
                <p>{formatHebrewDateTime(detail.startsAt)}</p>
                <p className="text-sm text-on-surface-variant">
                  עד {formatHebrewDateTime(detail.endsAt)}
                </p>
              </DetailSection>

              {detail.notes ? (
                <DetailSection title="הערות לקוח">
                  <p className="text-sm">{detail.notes}</p>
                </DetailSection>
              ) : null}

              <DetailSection title="הערה פנימית">
                <FieldTextarea
                  label=""
                  value={internalNote}
                  onChange={setInternalNote}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={isPending}
                  onClick={() =>
                    changeStatus(detail.status)
                  }
                >
                  שמירת הערה
                </Button>
              </DetailSection>

              <DetailSection title="העדפות תזכורת">
                <p className="text-sm text-on-surface-variant">{reminderLabel}</p>
                <p className="text-xs text-outline">
                  שליחת תזכורות בפועל טרם הופעלה.
                </p>
              </DetailSection>

              {detail.cancellationReason ? (
                <DetailSection title="סיבת ביטול">
                  <p className="text-sm">{detail.cancellationReason}</p>
                </DetailSection>
              ) : null}

              {isRefreshing ? (
                <p className="text-xs text-outline" role="status">
                  מעדכן פרטים מהשרת...
                </p>
              ) : null}

              {detail.auditEvents.length > 0 ? (
                <DetailSection title="יומן פעילות">
                  <ul className="space-y-2 text-xs text-on-surface-variant">
                    {detail.auditEvents.map((event) => (
                      <li key={`${event.action}-${event.createdAt}`}>
                        {event.action} · {formatHebrewDateTime(event.createdAt)}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-2">
                {detail.status === "pending" ? (
                  <Button
                    type="button"
                    variant="cta"
                    size="sm"
                    disabled={isPending}
                    onClick={() => changeStatus("confirmed")}
                  >
                    אישור
                  </Button>
                ) : null}
                {detail.status === "confirmed" ? (
                  <Button
                    type="button"
                    variant="cta"
                    size="sm"
                    disabled={isPending}
                    onClick={() => changeStatus("completed")}
                  >
                    סימון כהושלם
                  </Button>
                ) : null}
                {["pending", "confirmed"].includes(detail.status) ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => changeStatus("no_show")}
                    >
                      לא הגיע
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMode("edit")}
                    >
                      עריכה
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setMode("cancel")}
                    >
                      ביטול
                    </Button>
                  </>
                ) : null}
              </div>

              <p className="text-xs text-outline">
                נוצר: {formatHebrewDateTime(detail.createdAt)}
              </p>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-outline">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1">
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="flex min-h-20 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm"
      />
    </label>
  );
}
