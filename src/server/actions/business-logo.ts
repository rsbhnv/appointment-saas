"use server";

import { revalidatePath } from "next/cache";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import { findBusinessById } from "@/server/repositories/businesses";
import {
  removeBusinessLogo,
  uploadBusinessLogo,
} from "@/server/services/business-logo.service";
import { withAudit } from "@/server/services/with-audit";

import { actionError, type ActionResult } from "./action-result";

async function assertOwner() {
  return requireBusinessMember({ minimumRole: "business_owner" });
}

async function revalidateLogoPaths(businessId: string) {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  const business = await findBusinessById(businessId);
  if (business?.slug) {
    revalidatePath(`/${business.slug}/book`);
    revalidatePath(`/${business.slug}/my-appointments`);
  }
}

export const uploadBusinessLogoAction = withAudit(
  (_args, result) => ({
    action: "business.upload_logo",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "business",
    entityId: result.businessId,
  }),
  async (formData: FormData): Promise<
    ActionResult & { businessId?: string; userId?: string; logoUrl?: string }
  > => {
    try {
      const { membership, user } = await assertOwner();
      const file = formData.get("logo");
      if (!(file instanceof File)) {
        return actionError("invalid_input");
      }

      const result = await uploadBusinessLogo(membership.businessId, file);
      if (!result.ok) {
        return actionError(result.error);
      }

      await revalidateLogoPaths(membership.businessId);
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        logoUrl: result.logoUrl,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const removeBusinessLogoAction = withAudit(
  (_args, result) => ({
    action: "business.remove_logo",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "business",
    entityId: result.businessId,
  }),
  async (): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertOwner();
      const result = await removeBusinessLogo(membership.businessId);
      if (!result.ok) {
        return actionError(result.error);
      }

      await revalidateLogoPaths(membership.businessId);
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);
