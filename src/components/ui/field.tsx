import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
};

export function Field({ label, htmlFor, children, className, hint }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-on-surface-variant"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-outline">{hint}</p> : null}
    </div>
  );
}
