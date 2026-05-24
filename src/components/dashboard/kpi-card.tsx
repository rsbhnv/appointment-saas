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
        "glass-card rounded-xl p-6 shadow-purple-sm",
        accent && "border-e-4 border-e-primary-container",
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
