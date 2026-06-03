import Image from "next/image";

import { getBusinessInitial } from "@/lib/business/logo";
import { cn } from "@/lib/utils";

type BusinessLogoProps = {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  rounded?: "full" | "xl";
  /** Show uploaded logo at natural aspect ratio (no square crop). */
  natural?: boolean;
};

const SIZE_CLASSES = {
  sm: {
    box: "size-9 text-sm",
    image: 36,
    padding: "p-1",
  },
  md: {
    box: "size-16 text-xl sm:size-20 sm:text-2xl",
    image: 80,
    padding: "p-2",
  },
  lg: {
    box: "size-24 text-3xl sm:size-28 sm:text-4xl",
    image: 112,
    padding: "p-3",
  },
} as const;

export function BusinessLogo({
  name,
  logoUrl,
  size = "md",
  className,
  rounded = "xl",
  natural = false,
}: BusinessLogoProps) {
  const sizing = SIZE_CLASSES[size];
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-2xl";

  if (logoUrl?.trim()) {
    if (natural) {
      return (
        <div className={cn("flex shrink-0 items-center justify-center", className)}>
          <Image
            src={logoUrl}
            alt=""
            width={280}
            height={96}
            className="h-auto max-h-32 w-auto max-w-[min(100%,280px)] object-contain"
            unoptimized
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden border border-outline-variant/20 bg-surface-container-lowest shadow-sm",
          roundedClass,
          sizing.box,
          className,
        )}
      >
        <Image
          src={logoUrl}
          alt=""
          width={sizing.image}
          height={sizing.image}
          className={cn("size-full object-contain", sizing.padding)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-primary/20 bg-primary/10 font-bold text-primary",
        roundedClass,
        sizing.box,
        className,
      )}
      aria-hidden
    >
      {getBusinessInitial(name)}
    </div>
  );
}
