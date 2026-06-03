import Image from "next/image";

import { getBusinessInitial } from "@/lib/business/logo";
import { cn } from "@/lib/utils";

type BusinessLogoProps = {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const FALLBACK_SIZE_CLASSES = {
  sm: "size-9 text-sm",
  md: "size-16 text-xl sm:size-20 sm:text-2xl",
  lg: "size-24 text-3xl sm:size-28 sm:text-4xl",
} as const;

/** Uploaded logos: natural aspect ratio, no avatar frame. */
const LOGO_IMAGE_CLASSES = {
  sm: "max-h-9 max-w-[140px]",
  md: "max-h-16 max-w-[180px]",
  lg: "max-h-20 max-w-[220px]",
} as const;

const LOGO_IMAGE_DIMENSIONS = {
  sm: { width: 140, height: 36 },
  md: { width: 180, height: 64 },
  lg: { width: 220, height: 80 },
} as const;

export function BusinessLogo({
  name,
  logoUrl,
  size = "md",
  className,
}: BusinessLogoProps) {
  if (logoUrl?.trim()) {
    const dims = LOGO_IMAGE_DIMENSIONS[size];
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-transparent",
          className,
        )}
      >
        <Image
          src={logoUrl}
          alt=""
          width={dims.width}
          height={dims.height}
          className={cn(
            "block h-auto w-auto rounded-none border-0 bg-transparent object-contain shadow-none",
            LOGO_IMAGE_CLASSES[size],
          )}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary",
        FALLBACK_SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {getBusinessInitial(name)}
    </div>
  );
}
