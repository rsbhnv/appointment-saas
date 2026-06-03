"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import {
  createStaffMember,
  deleteStaffMember,
  updateStaffMember,
} from "@/server/repositories/staff-members";
import { withAudit } from "@/server/services/with-audit";

import { actionError, type ActionResult } from "./action-result";

const StaffFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  title: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});

const CreateStaffSchema = StaffFieldsSchema;
const UpdateStaffSchema = StaffFieldsSchema.extend({
  id: z.string().uuid(),
});

const DeleteStaffSchema = z.object({
  id: z.string().uuid(),
});

async function assertAdmin() {
  return requireBusinessMember({ minimumRole: "business_admin" });
}

function normalizeStaffInput<T extends z.infer<typeof StaffFieldsSchema>>(data: T) {
  return {
    ...data,
    title: data.title || null,
    phone: data.phone || null,
    email: data.email || null,
  };
}

export const createStaffAction = withAudit(
  (_args, result) => ({
    action: "staff.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "staff_member",
    entityId: result.staffId,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string; staffId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = CreateStaffSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const staff = await createStaffMember(
        membership.businessId,
        normalizeStaffInput(parsed.data),
      );

      revalidatePath("/dashboard/staff");
      revalidatePath("/dashboard");
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        staffId: staff.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateStaffAction = withAudit(
  (args, result) => ({
    action: "staff.update",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "staff_member",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = UpdateStaffSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await updateStaffMember(
        membership.businessId,
        parsed.data.id,
        normalizeStaffInput(parsed.data),
      );

      revalidatePath("/dashboard/staff");
      revalidatePath("/dashboard");
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      if (err instanceof Error && err.message.includes("not found")) {
        return actionError("not_found");
      }
      return actionError("unknown");
    }
  },
);

export const deleteStaffAction = withAudit(
  (args, result) => ({
    action: "staff.delete",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "staff_member",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = DeleteStaffSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await deleteStaffMember(membership.businessId, parsed.data.id);

      revalidatePath("/dashboard/staff");
      revalidatePath("/dashboard");
      return { ok: true, businessId: membership.businessId, userId: user.id };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      if (err instanceof Error) {
        if (err.message.includes("not found")) return actionError("not_found");
        if (err.message.includes("violates foreign key")) return actionError("in_use");
      }
      return actionError("unknown");
    }
  },
);
