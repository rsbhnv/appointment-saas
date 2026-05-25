import "server-only";

import { resolvePostLoginTarget } from "@/server/actions/post-login";
import { requireSession } from "@/server/guards";

/** Server-side auth helpers — session resolution only; sign-in stays in actions. */
export async function getCurrentSessionUser() {
  return requireSession();
}

export async function resolveLandingPath() {
  return resolvePostLoginTarget();
}
