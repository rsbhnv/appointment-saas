import "server-only";

import { GuardError } from "./errors";
import { requireSession, type SessionUser } from "./session";

/** Throws unless the active session belongs to a platform-level super admin. */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.platformRole !== "super_admin") {
    throw new GuardError("platform_admin_required");
  }
  return user;
}
