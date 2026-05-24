import { createBrowserClient } from "@supabase/ssr";

import { clientEnv, isSupabaseConfigured } from "@/lib/env/client";
import type { Database } from "@/types/database";

/**
 * Supabase browser client (anon key only).
 * All data access must be protected by Row Level Security in Supabase.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
