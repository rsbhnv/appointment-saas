import type { CalendarAppointment } from "@/lib/calendar/types";
import { formatHebrewDateTime } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";

type AppointmentCardProps = {
  appointment: CalendarAppointment;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
};

export function AppointmentCard({
  appointment,
  onClick,
  compact = false,
  className,
}: AppointmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-outline-variant/15 bg-card p-3 text-start shadow-sm transition-colors hover:border-primary/25 hover:bg-surface-container-low/80",
        compact && "p-2",
        className,
      )}
      aria-label={`תור: ${appointment.customer.fullName}, ${appointment.service.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold text-on-surface", compact && "text-sm")}>
            {appointment.customer.fullName}
          </p>
          <p className={cn("truncate text-on-surface-variant", compact ? "text-xs" : "text-sm")}>
            {appointment.service.name}
            {appointment.staff.name ? ` · ${appointment.staff.name}` : ""}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-outline">
              {formatHebrewDateTime(appointment.startsAt)}
            </p>
          ) : null}
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
    </button>
  );
}
