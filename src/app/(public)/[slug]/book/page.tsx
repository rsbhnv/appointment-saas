import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CustomerBookingSettings } from "@/components/portal/booking-types";
import { PublicBookingWizard } from "@/components/portal/public-booking-wizard";
import { StaffPortalGate } from "@/components/portal/staff-portal-gate";
import { customerBookingPath } from "@/lib/tenant/customer-portal-paths";
import { tryGetSession } from "@/server/guards";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import { listPublicActiveServicesByBusinessId } from "@/server/repositories/services";
import { listPublicActiveStaffByBusinessId } from "@/server/repositories/staff-members";
import { tenantService } from "@/server/services";

export const dynamic = "force-dynamic";

export default async function CustomerBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await tenantService.getPublicBusinessBySlug(slug);
  if (!business) notFound();

  const bookingPath = customerBookingPath(slug);

  const [services, staff, appSettings] = await Promise.all([
    listPublicActiveServicesByBusinessId(business.id),
    listPublicActiveStaffByBusinessId(business.id),
    findSettingsByBusinessId(business.id),
  ]);

  const bookingSettings: CustomerBookingSettings = {
    bookingWindowDays: appSettings?.booking_window_days ?? 30,
    allowCustomerCancellation: appSettings?.allow_customer_cancellation ?? true,
    cancellationMinHours: appSettings?.cancellation_min_hours ?? 0,
  };

  const session = await tryGetSession();

  if (session?.platformRole === "super_admin") {
    redirect("/super-admin");
  }

  let isStaffMember = false;
  if (session?.email) {
    const { findActiveMembershipsForUser } = await import(
      "@/server/repositories/business-members"
    );
    const memberships = await findActiveMembershipsForUser(session.id);
    isStaffMember = memberships.length > 0;
  }

  if (isStaffMember) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-4">
        <StaffPortalGate businessName={business.name} bookingPath={bookingPath} />
      </div>
    );
  }

  return (
    <>
      <PublicBookingWizard
          businessSlug={slug}
          businessName={business.name}
          businessDescription={business.description}
          businessAddress={business.address}
          arrivalInstructions={business.arrival_instructions}
          paymentMethods={business.payment_methods}
          businessCurrency={business.currency}
          logoUrl={business.logo_url}
          services={services}
          staff={staff}
          serviceNames={Object.fromEntries(services.map((s) => [s.id, s.name]))}
          settings={bookingSettings}
        />

      <p className="mt-10 text-center text-xs text-on-surface-variant/80">
        צוות {business.name}?{" "}
        <Link href="/login?next=/dashboard" className="font-medium text-primary hover:underline">
          כניסה ללוח בקרה
        </Link>
      </p>
    </>
  );
}
