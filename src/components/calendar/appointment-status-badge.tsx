import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/calendar/labels";
import type { AppointmentStatus } from "@/types/database";

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "accent" | "outline" | "destructive"
> = {
  pending: "outline",
  confirmed: "accent",
  completed: "accent",
  cancelled: "destructive",
  no_show: "destructive",
};

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
  className?: string;
};

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const variant = STATUS_VARIANT[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant === "accent" &&
          "border-primary/20 bg-primary/10 text-primary",
        variant === "outline" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
        variant === "destructive" &&
          "border-destructive/20 bg-destructive/10 text-destructive",
        className,
      )}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}
