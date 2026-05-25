import "server-only";

import { appointmentRepository } from "@/server/repositories";

/** Booking orchestration — full engine deferred; read-only listing for now. */
export async function listBusinessAppointments(businessId: string) {
  return appointmentRepository.listAppointmentsByBusinessId(businessId);
}
