import { BusinessLogo } from "@/components/business/business-logo";
import { portalSectionSubtitle, portalSectionTitle } from "@/lib/portal/styles";
import { cn } from "@/lib/utils";

type BusinessBookingHeaderProps = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  subtitle?: string;
  /** Landing: name → description → online title. Default: name → subtitle → description. */
  variant?: "default" | "landing";
  className?: string;
};

export function BusinessBookingHeader({
  name,
  description,
  logoUrl,
  subtitle = "הזמנת תור אונליין",
  variant = "default",
  className,
}: BusinessBookingHeaderProps) {
  return (
    <header className={cn("space-y-5 text-center", className)}>
      <BusinessLogo name={name} logoUrl={logoUrl} size="lg" className="mx-auto" />

      <div className="space-y-2">
        {variant === "landing" ? (
          <>
            <p className={portalSectionSubtitle}>ברוכים הבאים</p>
            <h1 className={portalSectionTitle}>{name}</h1>
            {description ? (
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-on-surface-variant">
                {description}
              </p>
            ) : null}
            <p className="pt-2 text-base font-semibold text-primary sm:text-lg">{subtitle}</p>
            <p className="text-sm text-on-surface-variant">בחרו מועד פנוי שמתאים לכם</p>
          </>
        ) : (
          <>
            <h1 className={portalSectionTitle}>{name}</h1>
            <p className="text-base font-semibold text-primary">{subtitle}</p>
            {description ? (
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}
