import { NextResponse } from "next/server";

/**
 * Public health check — no secrets, no auth required.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
