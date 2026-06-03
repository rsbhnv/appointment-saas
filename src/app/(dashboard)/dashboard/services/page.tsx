import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { isAdminRole } from "@/lib/auth/roles";
import { GuardError, requireBusinessMember } from "@/server/guards";
import { listServicesByBusinessId } from "@/server/repositories/services";

import { ServicesManager } from "./services-manager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  let membership;
  try {
    ({ membership } = await requireBusinessMember());
  } catch (err) {
    if (err instanceof GuardError && err.code === "no_business_membership") {
      return (
        <PageHeader
          title="שירותים"
          description="אין שיוך לעסק — לא ניתן לטעון שירותים."
        />
      );
    }
    throw err;
  }

  const services = await listServicesByBusinessId(membership.businessId);
  const canManage = isAdminRole(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="שירותים"
        description="ניהול קטלוג השירותים של העסק."
        action={<Badge variant="accent">{services.length}</Badge>}
      />
      <ServicesManager services={services} canManage={canManage} />
    </div>
  );
}
