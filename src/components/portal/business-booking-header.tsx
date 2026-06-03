import { BusinessLogo } from "@/components/business/business-logo";
import {
  portalLandingBusinessName,
  portalLandingDescription,
  portalLandingHint,
  portalLandingTagline,
  portalLandingWelcome,
} from "@/lib/portal/styles";
import { cn } from "@/lib/utils";

type BusinessBookingHeaderProps = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  subtitle?: string;
  /** Landing: welcome → name → description → online title. Default: name → subtitle → description. */
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
  if (variant === "landing") {
    return (
      <header className={cn("space-y-6 text-center", className)}>
        <BusinessLogo name={name} logoUrl={logoUrl} size="lg" className="mx-auto" />

        <div className="space-y-3">
          <p className={portalLandingWelcome}>ברוכים הבאים</p>
          <h1 className={portalLandingBusinessName}>{name}</h1>
          {description ? (
            <p className={portalLandingDescription}>{description}</p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-outline-variant/10 pt-6">
          <p className={portalLandingTagline}>{subtitle}</p>
          <p className={portalLandingHint}>בחרו מועד פנוי שמתאים לכם</p>
        </div>
      </header>
    );
  }

  return (
    <header className={cn("space-y-5 text-center", className)}>
      <BusinessLogo name={name} logoUrl={logoUrl} size="lg" className="mx-auto" />

      <div className="space-y-2">
        <h1 className={portalLandingBusinessName}>{name}</h1>
        <p className="text-base font-semibold text-primary">{subtitle}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
