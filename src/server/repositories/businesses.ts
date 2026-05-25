import "server-only";

import { readDemoBusiness, updateDemoBusiness } from "@/lib/demo/business-store";
import { DEMO_MEMBERSHIPS, DEMO_USER_IDS } from "@/lib/demo/fixtures";
import { readDemoSessionUser } from "@/lib/demo/session";
import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/database";

export type Business = Tables<"businesses">;
export type BusinessUpdate = TablesUpdate<"businesses">;

/** Returns one row by id; RLS hides businesses the caller cannot read. */
export async function findBusinessById(id: string): Promise<Business | null> {
  if (isDemoMode) {
    const business = readDemoBusiness();
    return id === business.id ? business : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`businesses lookup failed: ${error.message}`);
  return data ?? null;
}

/**
 * Returns one row by slug. Used for public tenant landing routes.
 * Reads from the `business_public` view in production (public columns only).
 */
export async function findBusinessBySlug(
  slug: string,
): Promise<Business | null> {
  if (isDemoMode) {
    const business = readDemoBusiness();
    return slug === business.slug ? business : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`business_public lookup failed: ${error.message}`);
  if (!data) return null;
  return findBusinessById(data.id);
}

/** Lists businesses the caller is a member of (RLS-filtered). */
export async function listBusinessesForUser(): Promise<Business[]> {
  if (isDemoMode) {
    const user = await readDemoSessionUser();
    if (!user) return [];
    const business = readDemoBusiness();
    if (user.id === DEMO_USER_IDS.super_admin) return [business];
    const isMember = DEMO_MEMBERSHIPS.some((m) => m.userId === user.id);
    return isMember ? [business] : [];
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`businesses list failed: ${error.message}`);
  return data ?? [];
}

/** Updates the business profile (name, branding, contact, …). */
export async function updateBusiness(
  id: string,
  patch: BusinessUpdate,
): Promise<Business> {
  if (isDemoMode) {
    const current = readDemoBusiness();
    if (current.id !== id) {
      throw new Error("business not found");
    }
    return updateDemoBusiness(patch);
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`businesses update failed: ${error.message}`);
  return data;
}
