import { CalendarDays } from "lucide-react";

type EmptyCalendarStateProps = {
  title?: string;
  description?: string;
};

export function EmptyCalendarState({
  title = "אין תורים בתקופה זו",
  description = "תורים חדשים יופיעו כאן. ניתן להוסיף תור ידנית או לקבל הזמנות מלקוחות.",
}: EmptyCalendarStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-16 text-center">
      <CalendarDays className="mb-4 size-10 text-outline" aria-hidden />
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
