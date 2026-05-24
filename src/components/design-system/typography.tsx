import { cn } from "@/lib/utils";

type TypographyProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function PageTitle({ children, className, id }: TypographyProps) {
  return (
    <h1
      id={id}
      className={cn(
        "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function PageDescription({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-lg text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function SectionTitle({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}
