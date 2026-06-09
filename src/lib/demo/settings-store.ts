import "server-only";

import { DEMO_SETTINGS_SEED } from "./fixtures";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

type SettingsStore = {
  rows: Tables<"app_settings">[];
};

const globalKey = Symbol.for("appointment-saas.demoSettingsStore");
type GlobalWithStore = typeof globalThis & { [globalKey]?: SettingsStore };

function getStore(): SettingsStore {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = { rows: DEMO_SETTINGS_SEED.map((row) => ({ ...row })) };
  }
  return g[globalKey]!;
}

export const demoSettingsStore = {
  findByBusinessId(businessId: string): Tables<"app_settings"> | null {
    const row = getStore().rows.find((item) => item.business_id === businessId);
    return row ? { ...row } : null;
  },

  upsert(
    businessId: string,
    patch: Omit<TablesUpdate<"app_settings">, "business_id">,
  ): Tables<"app_settings"> {
    const store = getStore();
    const index = store.rows.findIndex((row) => row.business_id === businessId);
    const now = new Date().toISOString();

    if (index === -1) {
      const input: TablesInsert<"app_settings"> = {
        business_id: businessId,
        booking_window_days: patch.booking_window_days ?? 30,
        min_hours_before_booking: patch.min_hours_before_booking ?? 2,
        max_appointments_per_customer_per_day:
          patch.max_appointments_per_customer_per_day ?? 1,
        max_appointments_per_customer_per_week:
          patch.max_appointments_per_customer_per_week ?? 1,
        max_appointments_per_customer_per_month:
          patch.max_appointments_per_customer_per_month ?? 1,
        limit_one_booking_per_day: patch.limit_one_booking_per_day ?? true,
        limit_one_booking_per_week: patch.limit_one_booking_per_week ?? false,
        limit_one_booking_per_month: patch.limit_one_booking_per_month ?? false,
        allow_customer_cancellation: patch.allow_customer_cancellation ?? true,
        cancellation_min_hours: patch.cancellation_min_hours ?? 4,
        default_slot_duration_minutes: patch.default_slot_duration_minutes ?? 60,
        break_between_appointments_minutes:
          patch.break_between_appointments_minutes ?? 15,
        confirmation_message: patch.confirmation_message ?? null,
      };
      const row: Tables<"app_settings"> = {
        id: input.id ?? crypto.randomUUID(),
        business_id: businessId,
        booking_window_days: input.booking_window_days ?? 30,
        min_hours_before_booking: input.min_hours_before_booking ?? 2,
        max_appointments_per_customer_per_day:
          input.max_appointments_per_customer_per_day ?? 1,
        max_appointments_per_customer_per_week:
          input.max_appointments_per_customer_per_week ?? 1,
        max_appointments_per_customer_per_month:
          input.max_appointments_per_customer_per_month ?? 1,
        limit_one_booking_per_day: input.limit_one_booking_per_day ?? true,
        limit_one_booking_per_week: input.limit_one_booking_per_week ?? false,
        limit_one_booking_per_month: input.limit_one_booking_per_month ?? false,
        allow_customer_cancellation: input.allow_customer_cancellation ?? true,
        cancellation_min_hours: input.cancellation_min_hours ?? 4,
        default_slot_duration_minutes: input.default_slot_duration_minutes ?? 60,
        break_between_appointments_minutes:
          input.break_between_appointments_minutes ?? 15,
        confirmation_message: input.confirmation_message ?? null,
        created_at: now,
        updated_at: now,
      };
      store.rows.push(row);
      return { ...row };
    }

    store.rows[index] = {
      ...store.rows[index]!,
      ...patch,
      updated_at: now,
    };
    return { ...store.rows[index]! };
  },

  reset(): void {
    const g = globalThis as GlobalWithStore;
    delete g[globalKey];
  },
};
