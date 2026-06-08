import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarManager } from "@/components/calendar/calendar-manager";
import { isAdminRole } from "@/lib/auth/roles";
import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import { listAppointmentsWithDetails } from "@/server/repositories/appointments";
import { listPublicActiveServicesByBusinessId } from "@/server/repositories/services";
import { listStaffByBusinessId } from "@/server/repositories/staff-members";
import { listCalendarAvailableSlots } from "@/server/services/appointment-slot.service";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@/lib/calendar/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  let membership;
  try {
    ({ membership } = await requireBusinessMember());
  } catch (err) {
    if (err instanceof GuardError && err.code === "no_business_membership") {
      return (
        <div className="space-y-6">
          <PageHeader
            title="יומן תורים"
            description="לא נבחר עסק פעיל"
          />
          <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
            לא נבחר עסק פעיל
          </div>
        </div>
      );
    }
    throw err;
  }

  const now = new Date();
  const from = startOfWeek(startOfMonth(now));
  const to = endOfWeek(endOfMonth(now));

  const [appointments, availableSlots, services, staff] = await Promise.all([
    listAppointmentsWithDetails(membership.businessId, {
      from: from.toISOString(),
      to: to.toISOString(),
    }),
    listCalendarAvailableSlots(
      {
        businessId: membership.businessId,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      { includePast: true },
    ),
    listPublicActiveServicesByBusinessId(membership.businessId),
    listStaffByBusinessId(membership.businessId),
  ]);

  const canManage = isAdminRole(membership.role) || membership.role === "staff";

  return (
    <div className="space-y-8">
      <PageHeader
        title="יומן תורים"
        description="צפייה, ניהול וקביעת תורים — כל הנתונים מוגבלים לעסק הפעיל שלך."
        action={
          <Badge variant="outline">
            {appointments.length} תורים בטווח
          </Badge>
        }
      />
      <CalendarManager
        initialAppointments={appointments}
        initialAvailableSlots={availableSlots}
        services={services}
        staff={staff}
        canManage={canManage}
      />
    </div>
  );
}
