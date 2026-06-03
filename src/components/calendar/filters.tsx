import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: FilterSelectProps) {
  return (
    <Field label={label} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface input-focus-ring",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

type StaffFilterProps = {
  value: string;
  onChange: (value: string) => void;
  staff: Array<{ id: string; name: string }>;
  className?: string;
};

export function StaffFilter({ value, onChange, staff, className }: StaffFilterProps) {
  return (
    <FilterSelect
      label="צוות"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "", label: "כל הצוות" },
        ...staff.map((member) => ({ value: member.id, label: member.name })),
      ]}
    />
  );
}

type ServiceFilterProps = {
  value: string;
  onChange: (value: string) => void;
  services: Array<{ id: string; name: string }>;
  className?: string;
};

export function ServiceFilter({
  value,
  onChange,
  services,
  className,
}: ServiceFilterProps) {
  return (
    <FilterSelect
      label="שירות"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "", label: "כל השירותים" },
        ...services.map((service) => ({ value: service.id, label: service.name })),
      ]}
    />
  );
}

type StatusFilterProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function StatusFilter({ value, onChange, className }: StatusFilterProps) {
  return (
    <FilterSelect
      label="סטטוס"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "", label: "כל הסטטוסים" },
        { value: "pending", label: "ממתין לאישור" },
        { value: "confirmed", label: "מאושר" },
        { value: "completed", label: "הושלם" },
        { value: "cancelled", label: "בוטל" },
        { value: "no_show", label: "לא הגיע" },
      ]}
    />
  );
}
