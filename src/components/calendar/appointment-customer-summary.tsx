import type { CalendarAppointmentCustomer } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type AppointmentCustomerSummaryProps = {
  customer: CalendarAppointmentCustomer;
  showName?: boolean;
  showServiceLine?: boolean;
  serviceName?: string;
  staffName?: string;
  className?: string;
  compact?: boolean;
};

function contactParts(customer: CalendarAppointmentCustomer): {
  phone: string | null;
  email: string | null;
} {
  return {
    phone: customer.phone?.trim() || null,
    email: customer.email?.trim() || null,
  };
}

export function AppointmentCustomerSummary({
  customer,
  showName = true,
  showServiceLine = false,
  serviceName,
  staffName,
  className,
  compact = false,
}: AppointmentCustomerSummaryProps) {
  const { phone, email } = contactParts(customer);
  const hasContact = Boolean(phone || email);

  return (
    <div className={cn("min-w-0 space-y-0.5", className)}>
      {showName ? (
        <p
          className={cn(
            "font-semibold text-on-surface",
            compact ? "text-sm truncate" : "truncate",
          )}
        >
          {customer.fullName}
        </p>
      ) : null}

      {hasContact ? (
        <p
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-on-surface-variant",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="rounded-sm underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              dir="ltr"
              onClick={(event) => event.stopPropagation()}
              aria-label={`טלפון: ${phone}`}
            >
              {phone}
            </a>
          ) : null}
          {phone && email ? (
            <span className="text-outline" aria-hidden>
              ·
            </span>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="truncate rounded-sm underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              dir="ltr"
              onClick={(event) => event.stopPropagation()}
              aria-label={`אימייל: ${email}`}
            >
              {email}
            </a>
          ) : null}
        </p>
      ) : (
        <p className={cn("text-on-surface-variant", compact ? "text-[11px]" : "text-xs")}>
          אין טלפון או אימייל ללקוח
        </p>
      )}

      {showServiceLine && serviceName ? (
        <p className={cn("truncate text-on-surface-variant", compact ? "text-[11px]" : "text-sm")}>
          {serviceName}
          {staffName ? ` · ${staffName}` : ""}
        </p>
      ) : null}
    </div>
  );
}
