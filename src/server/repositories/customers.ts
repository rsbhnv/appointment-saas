import "server-only";

import { isDemoMode } from "@/lib/env/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Customer = Tables<"customers">;

export {
  findCustomerByPhoneAndBusinessId,
  findOrCreateCustomerByPhone,
} from "@/server/repositories/public-booking";

export type CustomerProfile = {
  customerId: string;
  businessId: string;
  businessSlug: string;
  businessName: string;
  fullName: string;
};

export async function findCustomerProfilesByEmail(
  email: string,
): Promise<CustomerProfile[]> {
  if (isDemoMode) return [];
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const supabase = await createSupabaseServerClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, business_id, full_name, email")
    .ilike("email", normalized);

  if (error) throw new Error(`customers profile lookup failed: ${error.message}`);
  if (!customers?.length) return [];

  const profiles: CustomerProfile[] = [];
  for (const row of customers) {
    const { data: pub, error: pubError } = await supabase
      .from("business_public")
      .select("id, slug, name")
      .eq("id", row.business_id)
      .maybeSingle();
    if (pubError) {
      throw new Error(`business_public lookup failed: ${pubError.message}`);
    }
    if (!pub) continue;
    profiles.push({
      customerId: row.id,
      businessId: row.business_id,
      businessSlug: pub.slug,
      businessName: pub.name,
      fullName: row.full_name,
    });
  }
  return profiles;
}

export async function findCustomerByEmailAndBusinessId(
  businessId: string,
  email: string,
): Promise<Customer | null> {
  if (isDemoMode) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .ilike("email", normalized)
    .maybeSingle();
  if (error) throw new Error(`customers lookup failed: ${error.message}`);
  return data ?? null;
}

/** Creates a CRM customer row for the signed-in user's email when booking. */
export async function ensureCustomerForBooking(
  businessId: string,
  email: string,
  fullName: string,
): Promise<Customer> {
  if (isDemoMode) {
    throw new Error("booking not supported in demo mode");
  }
  const existing = await findCustomerByEmailAndBusinessId(businessId, email);
  if (existing) return existing;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
    })
    .select("*")
    .single();
  if (error) throw new Error(`customers create failed: ${error.message}`);
  return data;
}

export async function listCustomersByBusinessId(
  businessId: string,
): Promise<Customer[]> {
  if (isDemoMode) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("full_name");
  if (error) throw new Error(`customers list failed: ${error.message}`);
  return data ?? [];
}

export async function findCustomerById(
  businessId: string,
  id: string,
): Promise<Customer | null> {
  if (isDemoMode) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`customers lookup failed: ${error.message}`);
  return data ?? null;
}

export async function searchCustomersByBusinessId(
  businessId: string,
  query: string,
  limit = 20,
): Promise<Customer[]> {
  if (isDemoMode) return [];
  const trimmed = query.trim();
  if (!trimmed) return listCustomersByBusinessId(businessId);

  const supabase = await createSupabaseServerClient();
  const pattern = `%${trimmed}%`;
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .or(
      `full_name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`,
    )
    .order("full_name")
    .limit(limit);

  if (error) throw new Error(`customers search failed: ${error.message}`);
  return data ?? [];
}

export type CreateCustomerInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  sms_consent?: boolean;
  whatsapp_consent?: boolean;
  email_consent?: boolean;
};

export async function createCustomer(
  businessId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  if (isDemoMode) {
    throw new Error("customers not supported in demo mode");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      notes: input.notes?.trim() || null,
      sms_consent: input.sms_consent ?? false,
      whatsapp_consent: input.whatsapp_consent ?? false,
      email_consent: input.email_consent ?? false,
    })
    .select("*")
    .single();
  if (error) throw new Error(`customers create failed: ${error.message}`);
  return data;
}
