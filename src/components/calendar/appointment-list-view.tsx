"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import { formatHebrewDateTime, formatHebrewTime } from "@/lib/calendar/utils";
import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";
import { PAYMENT_STATUS_LABELS } from "@/lib/calendar/labels";

type AppointmentListViewProps = {
  appointments: CalendarAppointment[];
  onSelect: (id: string) => void;
};

export function AppointmentListView({
  appointments,
  onSelect,
}: AppointmentListViewProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {appointments.map((appointment) => (
          <button
            key={appointment.id}
            type="button"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-start transition hover:bg-surface-container-low/80"
            onClick={() => onSelect(appointment.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-on-surface">
                  {appointment.customer.fullName}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {formatHebrewDateTime(appointment.startsAt)} –{" "}
                  {formatHebrewTime(appointment.endsAt)}
                </p>
                <p className="text-sm text-on-surface">{appointment.service.name}</p>
                {appointment.staff.name ? (
                  <p className="text-xs text-on-surface-variant">{appointment.staff.name}</p>
                ) : null}
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-outline-variant/30 md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th className="px-3 py-3 text-start font-medium">התחלה</th>
              <th className="px-3 py-3 text-start font-medium">סיום</th>
              <th className="px-3 py-3 text-start font-medium">לקוח</th>
              <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">
                טלפון
              </th>
              <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">
                אימייל
              </th>
              <th className="px-3 py-3 text-start font-medium">שירות</th>
              <th className="hidden px-3 py-3 text-start font-medium sm:table-cell">
                צוות
              </th>
              <th className="px-3 py-3 text-start font-medium">סטטוס</th>
              <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">
                תשלום
              </th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="cursor-pointer border-t border-outline-variant/20 hover:bg-surface-container-low/60"
                onClick={() => onSelect(appointment.id)}
              >
                <td className="px-3 py-3 whitespace-nowrap">
                  {formatHebrewDateTime(appointment.startsAt)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {formatHebrewTime(appointment.endsAt)}
                </td>
                <td className="px-3 py-3 font-medium">{appointment.customer.fullName}</td>
                <td className="hidden px-3 py-3 lg:table-cell" dir="ltr">
                  {appointment.customer.phone ?? "—"}
                </td>
                <td className="hidden px-3 py-3 lg:table-cell" dir="ltr">
                  {appointment.customer.email ?? "—"}
                </td>
                <td className="px-3 py-3">{appointment.service.name}</td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  {appointment.staff.name}
                </td>
                <td className="px-3 py-3">
                  <AppointmentStatusBadge status={appointment.status} />
                </td>
                <td className="hidden px-3 py-3 lg:table-cell">
                  {appointment.paymentStatus
                    ? PAYMENT_STATUS_LABELS[appointment.paymentStatus]
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
