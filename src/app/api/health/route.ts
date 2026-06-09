import { NextResponse } from "next/server";

import { isDemoMode } from "@/lib/env/client";
import {
  isSupabaseAdminConfigured,
  isTwilioConfigured,
} from "@/lib/env/server";

/**
 * Public health check — no secrets, no auth required.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    twilioConfigured: isTwilioConfigured(),
    supabaseAdminConfigured: isSupabaseAdminConfigured,
    demoMode: isDemoMode,
  });
}
