import { PageHeader } from "@/components/dashboard/page-header";
import { isOwnerRole } from "@/lib/auth/roles";
import { GuardError, requireBusinessMember } from "@/server/guards";
import { findSettingsByBusinessId } from "@/server/repositories/app-settings";
import { findBusinessById } from "@/server/repositories/businesses";

import { ChangePasswordForm } from "./change-password-form";
import { BusinessLogoForm } from "./business-logo-form";
import { BusinessThemeForm } from "./business-theme-form";
import { SettingsForms } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let membership;
  let userEmail: string | null = null;
  try {
    const ctx = await requireBusinessMember();
    membership = ctx.membership;
    userEmail = ctx.user.email;
  } catch (err) {
    if (err instanceof GuardError && err.code === "no_business_membership") {
      return (
        <PageHeader
          title="הגדרות"
          description="אין שיוך לעסק — לא ניתן לטעון הגדרות."
        />
      );
    }
    throw err;
  }

  const [business, settings] = await Promise.all([
    findBusinessById(membership.businessId),
    findSettingsByBusinessId(membership.businessId),
  ]);

  if (!business) {
    return (
      <PageHeader title="הגדרות" description="העסק לא נמצא." />
    );
  }

  const canEdit = isOwnerRole(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="הגדרות"
        description="פרופיל העסק, הגדרות הזמנה וחשבון משתמש."
      />
      <ChangePasswordForm userEmail={userEmail} />
      <SettingsForms business={business} settings={settings} canEdit={canEdit} />
      <BusinessLogoForm business={business} canEdit={canEdit} />
      <BusinessThemeForm business={business} canEdit={canEdit} />
    </div>
  );
}
