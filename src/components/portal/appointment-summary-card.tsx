import { portalCard, portalCardInner } from "@/lib/portal/styles";
import { cn } from "@/lib/utils";

type AppointmentSummaryCardProps = {
  title?: string;
  businessName?: string | null;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
  arrivalLabel: string;
  paymentLabel: string;
  className?: string;
};

export function AppointmentSummaryCard({
  title = "פרטי התור",
  businessName,
  serviceName,
  dateLabel,
  timeLabel,
  priceLabel,
  arrivalLabel,
  paymentLabel,
  className,
}: AppointmentSummaryCardProps) {
  return (
    <div className={cn(portalCard, portalCardInner, "bg-surface-container-low/40", className)}>
      <h3 className="mb-4 border-b border-outline-variant/15 pb-3 text-base font-bold text-on-surface">
        {title}
      </h3>
      <dl className="grid gap-4 text-sm">
        {businessName ? <SummaryRow label="עסק" value={businessName} /> : null}
        <SummaryRow label="שירות" value={serviceName} />
        <SummaryRow label="תאריך" value={dateLabel} />
        <SummaryRow label="שעה" value={timeLabel} />
        <SummaryRow label="עלות" value={priceLabel} highlight />
        <SummaryRow label="כתובת הגעה" value={arrivalLabel} multiline />
        <SummaryRow label="אופן תשלום" value={paymentLabel} multiline />
      </dl>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  multiline = false,
  highlight = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[7rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </dt>
      <dd
        className={cn(
          "font-medium text-on-surface",
          highlight && "text-lg text-primary",
          multiline && "whitespace-pre-line",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
