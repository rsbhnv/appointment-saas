import "server-only";

import { availabilityRepository } from "@/server/repositories";

export type SlotQuery = {
  businessId: string;
  staffMemberId?: string;
  from: Date;
  to: Date;
};

/**
 * Rule-based slot engine (no materialized slots).
 * Computes availability from availability_rules, availability_exceptions,
 * slot_overrides, and existing appointments at query time.
 *
 * Full algorithm deferred — this service loads source data only.
 */
export async function loadAvailabilitySources(businessId: string) {
  const [rules, exceptions, overrides] = await Promise.all([
    availabilityRepository.listAvailabilityRules(businessId),
    availabilityRepository.listAvailabilityExceptions(businessId),
    availabilityRepository.listSlotOverrides(businessId),
  ]);
  return { rules, exceptions, overrides };
}

export async function computeSlots(_query: SlotQuery): Promise<
  Array<{ startsAt: string; endsAt: string; staffMemberId: string }>
> {
  void _query;
  return [];
}
