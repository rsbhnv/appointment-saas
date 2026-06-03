import { CALENDAR_VIEW_LABELS, type CalendarView } from "@/lib/calendar/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CalendarViewSwitcherProps = {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
  className?: string;
};

const VIEWS: CalendarView[] = ["day", "week", "month", "list"];

export function CalendarViewSwitcher({
  value,
  onChange,
  className,
}: CalendarViewSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex w-full max-w-full gap-1 overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1 scrollbar-none sm:w-auto sm:flex-wrap sm:overflow-visible",
        className,
      )}
      role="tablist"
      aria-label="תצוגת יומן"
    >
      {VIEWS.map((view) => (
        <Button
          key={view}
          type="button"
          role="tab"
          aria-selected={value === view}
          variant={value === view ? "cta" : "ghost"}
          size="sm"
          className="h-10 shrink-0 px-3 max-md:h-11"
          onClick={() => onChange(view)}
        >
          {CALENDAR_VIEW_LABELS[view]}
        </Button>
      ))}
    </div>
  );
}
