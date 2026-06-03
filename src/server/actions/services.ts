"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import {
  createService,
  deleteService,
  updateService,
} from "@/server/repositories/services";
import { withAudit } from "@/server/services/with-audit";

import { actionError, type ActionResult } from "./action-result";

const ServiceFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  currency: z.string().trim().min(3).max(3).default("ILS"),
  active: z.coerce.boolean().default(true),
});

const CreateServiceSchema = ServiceFieldsSchema;
const UpdateServiceSchema = ServiceFieldsSchema.extend({
  id: z.string().uuid(),
});

const DeleteServiceSchema = z.object({
  id: z.string().uuid(),
});

async function assertAdmin() {
  return requireBusinessMember({ minimumRole: "business_admin" });
}

export const createServiceAction = withAudit(
  (_args, result) => ({
    action: "service.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "service",
    entityId: result.serviceId,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string; serviceId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = CreateServiceSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const service = await createService(membership.businessId, {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        currency: parsed.data.currency,
        active: parsed.data.active,
      });

      revalidatePath("/dashboard/services");
      revalidatePath("/dashboard");
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        serviceId: service.id,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);

export const updateServiceAction = withAudit(
  (args, result) => ({
    action: "service.update",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "service",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = UpdateServiceSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await updateService(membership.businessId, parsed.data.id, {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        currency: parsed.data.currency,
        active: parsed.data.active,
      });

      revalidatePath("/dashboard/services");
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

export const deleteServiceAction = withAudit(
  (args, result) => ({
    action: "service.delete",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "service",
    entityId: (args[0] as { id?: string })?.id ?? null,
  }),
  async (input: unknown): Promise<ActionResult & { businessId?: string; userId?: string }> => {
    try {
      const { membership, user } = await assertAdmin();
      const parsed = DeleteServiceSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      await deleteService(membership.businessId, parsed.data.id);

      revalidatePath("/dashboard/services");
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
