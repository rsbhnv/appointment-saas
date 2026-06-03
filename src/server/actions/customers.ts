"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GuardError } from "@/server/guards";
import { requireBusinessMember } from "@/server/guards/business-member";
import {
  createCustomer,
  searchCustomersByBusinessId,
} from "@/server/repositories/customers";
import { withAudit } from "@/server/services/with-audit";
import type { Tables } from "@/types/database";

import { actionError, type ActionResult } from "./action-result";

const SearchCustomersSchema = z.object({
  query: z.string().trim().max(200).default(""),
});

const CreateCustomerSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  sms_consent: z.coerce.boolean().default(false),
  whatsapp_consent: z.coerce.boolean().default(false),
  email_consent: z.coerce.boolean().default(false),
});

export async function searchCustomersAction(
  input: unknown,
): Promise<
  | { ok: true; customers: Tables<"customers">[] }
  | { ok: false; error: string }
> {
  try {
    const { membership } = await requireBusinessMember();
    const parsed = SearchCustomersSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false, error: "invalid_input" };

    const customers = await searchCustomersByBusinessId(
      membership.businessId,
      parsed.data.query,
    );
    return { ok: true, customers };
  } catch (err) {
    if (err instanceof GuardError) return { ok: false, error: err.code };
    return { ok: false, error: "unknown" };
  }
}

export const createCustomerAction = withAudit(
  (_args, result) => ({
    action: "customer.create",
    businessId: result.businessId,
    userId: result.userId,
    entityType: "customer",
    entityId: result.customerId ?? null,
  }),
  async (
    input: unknown,
  ): Promise<
    ActionResult & { businessId?: string; userId?: string; customerId?: string; customer?: Tables<"customers"> }
  > => {
    try {
      const { membership, user } = await requireBusinessMember();
      const parsed = CreateCustomerSchema.safeParse(input);
      if (!parsed.success) return actionError("invalid_input");

      const customer = await createCustomer(membership.businessId, {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email || null,
        sms_consent: parsed.data.sms_consent,
        whatsapp_consent: parsed.data.whatsapp_consent,
        email_consent: parsed.data.email_consent,
      });

      revalidatePath("/dashboard/calendar");
      revalidatePath("/dashboard/customers");
      return {
        ok: true,
        businessId: membership.businessId,
        userId: user.id,
        customerId: customer.id,
        customer,
      };
    } catch (err) {
      if (err instanceof GuardError) return actionError(err.code);
      return actionError("unknown");
    }
  },
);
