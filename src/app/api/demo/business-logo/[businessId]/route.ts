import { isDemoMode } from "@/lib/env/client";
import { readDemoBusinessLogo } from "@/lib/demo/logo-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ businessId: string }> },
) {
  if (!isDemoMode) {
    return new Response("Not found", { status: 404 });
  }

  const { businessId } = await context.params;
  const logo = readDemoBusinessLogo(businessId);
  if (!logo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
