import "server-only";

import { listDemoAuditEvents } from "@/lib/demo/audit-store";
import { isDemoMode } from "@/lib/env/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/env/server";
import type { Json, Tables } from "@/types/database";

export type AuditLog = Tables<"audit_logs">;

export async function listAuditLogs(filter?: {
  businessId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  if (isDemoMode) {
    return listDemoAuditEvents({ businessId: filter?.businessId ?? null }).map(
      (row) => ({
        id: row.id,
        business_id: row.business_id,
        user_id: row.user_id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        metadata: row.metadata as Json,
        created_at: row.created_at,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.businessId) {
    query = query.eq("business_id", filter.businessId);
  }
  if (filter?.limit) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`audit_logs list failed: ${error.message}`);
  return data ?? [];
}

/** Service-role insert — used by audit service only. */
export async function insertAuditLog(
  row: Omit<Tables<"audit_logs">, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
  },
): Promise<void> {
  if (isDemoMode) return;
  if (!isSupabaseAdminConfigured) return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    business_id: row.business_id,
    user_id: row.user_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata,
  });
  if (error) throw new Error(`audit_logs insert failed: ${error.message}`);
}
