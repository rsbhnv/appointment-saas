import Link from "next/link";
import { notFound } from "next/navigation";

import type { CustomerBookingSettings } from "@/components/portal/booking-types";
import { MyAppointmentsPanel } from "@/components/portal/my-appointments-panel";
import { customerBookingPath } from "@/lib/tenant/customer-portal-paths";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import { listPublicActiveServicesByBusinessId } from "@/server/repositories/services";
import { tenantService } from "@/server/services";

export const dynamic = "force-dynamic";

export default async function MyAppointmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await tenantService.getPublicBusinessBySlug(slug);
  if (!business) notFound();

  const [services, appSettings] = await Promise.all([
    listPublicActiveServicesByBusinessId(business.id),
    findSettingsByBusinessId(business.id),
  ]);

  const settings: CustomerBookingSettings = {
    bookingWindowDays: appSettings?.booking_window_days ?? 30,
    minHoursBeforeBooking: appSettings?.min_hours_before_booking ?? 2,
    allowCustomerCancellation: appSettings?.allow_customer_cancellation ?? true,
    cancellationMinHours: appSettings?.cancellation_min_hours ?? 0,
  };

  const serviceNames = Object.fromEntries(services.map((s) => [s.id, s.name]));

  return (
    <>
      <MyAppointmentsPanel
        businessSlug={slug}
        businessName={business.name}
        businessDescription={business.description}
        logoUrl={business.logo_url}
        serviceNames={serviceNames}
        settings={settings}
      />

      <p className="mt-8 text-center text-xs text-on-surface-variant">
        <Link href={customerBookingPath(slug)} className="font-medium text-primary hover:underline">
          קביעת תור חדש
        </Link>
      </p>
    </>
  );
}
