import { CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container",
        className,
      )}
      aria-hidden="true"
    >
      <CalendarClock className="size-[60%]" strokeWidth={2.25} />
    </span>
  );
}
