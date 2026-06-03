import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { isAdminRole } from "@/lib/auth/roles";
import { GuardError, requireBusinessMember } from "@/server/guards";
import { listStaffByBusinessId } from "@/server/repositories/staff-members";

import { StaffManager } from "./staff-manager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  let membership;
  try {
    ({ membership } = await requireBusinessMember());
  } catch (err) {
    if (err instanceof GuardError && err.code === "no_business_membership") {
      return (
        <PageHeader
          title="צוות"
          description="אין שיוך לעסק — לא ניתן לטעון צוות."
        />
      );
    }
    throw err;
  }

  const staff = await listStaffByBusinessId(membership.businessId);
  const canManage = isAdminRole(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="צוות"
        description="ניהול אנשי הצוות של העסק."
        action={<Badge variant="accent">{staff.length}</Badge>}
      />
      <StaffManager staff={staff} canManage={canManage} />
    </div>
  );
}
