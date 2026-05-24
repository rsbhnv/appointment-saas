import "server-only";

import { recordAuditEvent, type AuditEvent } from "./audit";

type ActionFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

type AuditDescriptor<TArgs extends unknown[], TResult> =
  | string
  | ((args: TArgs, result: TResult) => AuditEvent);

/**
 * Wraps a Server Action so a successful execution emits an audit row.
 * If the action throws, no audit is recorded (failures are out of scope for v1).
 *
 * Logging never blocks the action result.
 */
export function withAudit<TArgs extends unknown[], TResult>(
  descriptor: AuditDescriptor<TArgs, TResult>,
  fn: ActionFn<TArgs, TResult>,
): ActionFn<TArgs, TResult> {
  return async (...args: TArgs) => {
    const result = await fn(...args);
    const event =
      typeof descriptor === "string"
        ? ({ action: descriptor } satisfies AuditEvent)
        : descriptor(args, result);
    void recordAuditEvent(event);
    return result;
  };
}
