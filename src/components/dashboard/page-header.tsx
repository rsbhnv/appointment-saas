import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row-reverse md:items-center md:justify-between",
        className,
      )}
    >
      <div className="space-y-1 text-start">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-base leading-relaxed text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
