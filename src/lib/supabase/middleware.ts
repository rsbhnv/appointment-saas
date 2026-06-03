import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { clientEnv, isSupabaseConfigured } from "@/lib/env/client";
import { getSupabaseFetch } from "@/lib/supabase/fetch-insecure";
import type { Database } from "@/types/database";

export type SessionUpdateResult = {
  response: NextResponse;
  userId: string | null;
};

/**
 * Refreshes the Supabase auth session in the proxy.
 * No-op when Supabase env vars are not configured (local scaffold).
 */
export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<SessionUpdateResult> {
  if (!isSupabaseConfigured) {
    return { response, userId: null };
  }

  let supabaseResponse = response;

  const customFetch = getSupabaseFetch();

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(customFetch ? { global: { fetch: customFetch } } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, userId: user?.id ?? null };
}
