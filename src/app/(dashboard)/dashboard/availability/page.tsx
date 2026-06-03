import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { isAdminRole, isOwnerRole } from "@/lib/auth/roles";
import { GuardError, requireBusinessMember } from "@/server/guards";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import {
  listAvailabilityExceptions,
  listAvailabilityRules,
  listSlotOverrides,
} from "@/server/repositories/availability";
import { listAppointmentsWithDetails } from "@/server/repositories/appointments";
import { listStaffByBusinessId } from "@/server/repositories/staff-members";
import { listCalendarAvailableSlots } from "@/server/services/appointment-slot.service";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@/lib/calendar/utils";

import { AvailabilityManager } from "./availability-manager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  let membership;
  try {
    ({ membership } = await requireBusinessMember());
  } catch (err) {
    if (err instanceof GuardError && err.code === "no_business_membership") {
      return (
        <PageHeader
          title="זמינות"
          description="אין שיוך לעסק — לא ניתן לטעון זמינות."
        />
      );
    }
    throw err;
  }

  const now = new Date();
  const scheduleFrom = startOfWeek(startOfMonth(now));
  const scheduleTo = endOfWeek(endOfMonth(now));

  const [rules, exceptions, blocks, staff, settings, appointments, availableSlots] =
    await Promise.all([
      listAvailabilityRules(membership.businessId),
      listAvailabilityExceptions(membership.businessId),
      listSlotOverrides(membership.businessId),
      listStaffByBusinessId(membership.businessId),
      findSettingsByBusinessId(membership.businessId),
      listAppointmentsWithDetails(membership.businessId, {
        from: scheduleFrom.toISOString(),
        to: scheduleTo.toISOString(),
      }),
      listCalendarAvailableSlots({
        businessId: membership.businessId,
        from: scheduleFrom.toISOString(),
        to: scheduleTo.toISOString(),
      }),
    ]);

  const blockRows = blocks.filter((row) => row.override_type === "block");
  const canManage = isAdminRole(membership.role);
  const canEditSlotSettings = isOwnerRole(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="זמינות"
        description="לוח חודשי לזמינות לפי תאריך, שעות שבועיות, חסימות והגדרות סלוטים — משפיע על היומן והפורטל."
        action={<Badge variant="accent">{rules.length} כללים</Badge>}
      />
      <AvailabilityManager
        rules={rules}
        exceptions={exceptions}
        blocks={blockRows}
        staff={staff.filter((member) => member.active)}
        canManage={canManage}
        canEditSlotSettings={canEditSlotSettings}
        settings={settings}
        initialAppointments={appointments}
        initialAvailableSlots={availableSlots}
      />
    </div>
  );
}
