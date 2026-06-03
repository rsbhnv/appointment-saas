import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 text-base text-on-surface transition-all placeholder:text-outline/50 input-focus-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
