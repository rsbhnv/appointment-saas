import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  className?: string;
};

export function KpiCard({
  label,
  value,
  hint,
  accent = false,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-outline-variant/15 bg-card p-6 shadow-[0_4px_24px_rgba(28,32,24,0.06)]",
        accent && "ring-2 ring-primary/20",
        className,
      )}
    >
      <p className="mb-1 text-sm font-medium text-outline">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <span className="text-3xl font-bold tracking-tight text-on-surface">
          {value}
        </span>
        {hint ? (
          <span className="text-xs font-medium text-primary">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
