/**
 * Shared error codes for server guards.
 * Pages use these to render the right copy or perform a redirect.
 */
export type GuardErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "no_business_membership"
  | "platform_admin_required";

export class GuardError extends Error {
  readonly code: GuardErrorCode;

  constructor(code: GuardErrorCode, message?: string) {
    super(message ?? code);
    this.name = "GuardError";
    this.code = code;
  }
}
