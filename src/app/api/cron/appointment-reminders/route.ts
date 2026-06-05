import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/env/server";
import { processAppointmentReminders } from "@/server/services/appointment-sms.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Hourly cron: send 24-hour appointment reminder SMS. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!isCronAuthorized(authHeader)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await processAppointmentReminders();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[cron] appointment_reminders_failed", { error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
