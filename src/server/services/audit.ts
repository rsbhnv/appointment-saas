import "server-only";

import { appendDemoAuditEvent } from "@/lib/demo/audit-store";
import { isDemoMode } from "@/lib/env/client";
import { isSupabaseAdminConfigured } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditEvent = {
  action: string;
  businessId?: string | null;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
};

/**
 * Writes a row to `audit_logs` via the service role.
 *
 * Audit writes must not break the calling action — logging failures are
 * captured and surfaced via console.error, never re-thrown.
 */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  if (isDemoMode) {
    appendDemoAuditEvent({
      business_id: event.businessId ?? null,
      user_id: event.userId ?? null,
      action: event.action,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      metadata: (event.metadata as Record<string, unknown> | null | undefined) ?? {},
    });
    return;
  }

  if (!isSupabaseAdminConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit] skipped (no service role configured)", event.action);
    }
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      action: event.action,
      business_id: event.businessId ?? null,
      user_id: event.userId ?? null,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      metadata: event.metadata ?? {},
    });
    if (error) {
      console.error("[audit] insert failed", error.message, event.action);
    }
  } catch (err) {
    console.error("[audit] threw", err, event.action);
  }
}
