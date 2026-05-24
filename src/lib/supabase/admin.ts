import "server-only";

import { createClient } from "@supabase/supabase-js";

import { clientEnv, isSupabaseConfigured } from "@/lib/env/client";
import { isSupabaseAdminConfigured, serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

/**
 * Supabase admin client (service role).
 * Bypasses RLS — use only for trusted server-side operations
 * (webhooks, migrations, tenant provisioning). Never expose to the client.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseConfigured || !isSupabaseAdminConfigured) {
    throw new Error(
      "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
