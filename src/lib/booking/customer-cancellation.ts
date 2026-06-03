import type { AppointmentStatus } from "@/types/database";

export type CancellationPolicyInput = {
  allowCustomerCancellation: boolean;
  cancellationMinHours: number;
};

type AppointmentSlice = {
  id: string;
  status: AppointmentStatus;
  starts_at: string;
};

/** Returns appointment IDs the customer may cancel at `referenceTime`. */
export function getCancellableAppointmentIds(
  appointments: AppointmentSlice[],
  policy: CancellationPolicyInput,
  referenceTime: Date = new Date(),
): string[] {
  if (!policy.allowCustomerCancellation) return [];

  const nowMs = referenceTime.getTime();
  return appointments
    .filter((appt) => {
      if (appt.status !== "pending" && appt.status !== "confirmed") return false;
      const hoursUntil =
        (new Date(appt.starts_at).getTime() - nowMs) / 3_600_000;
      return hoursUntil >= policy.cancellationMinHours;
    })
    .map((appt) => appt.id);
}
