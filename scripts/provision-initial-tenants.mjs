/**
 * One-time tenant provisioning for local/staging setup.
 * Run: node --env-file=.env.local scripts/provision-initial-tenants.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { Agent, fetch as undiciFetch } from "undici";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const insecureTls = process.env.SUPABASE_INSECURE_TLS === "true";
const insecureAgent = insecureTls
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;
const customFetch = insecureAgent
  ? (input, init) =>
      undiciFetch(input, { ...init, dispatcher: insecureAgent })
  : undefined;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(customFetch ? { global: { fetch: customFetch } } : {}),
});

async function ensureUser(email) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function setSuperAdmin(userId) {
  const { data: user, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError) throw getError;

  const appMeta = {
    ...(user.user.app_metadata ?? {}),
    platform_role: "super_admin",
  };

  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: appMeta,
  });
  if (error) throw error;
}

async function main() {
  const superAdmin = await ensureUser("rsbhnv@gmail.com");
  await setSuperAdmin(superAdmin.id);
  console.log("super_admin:", superAdmin.email);

  const businessOwner = await ensureUser("eshbhnv@gmail.com");
  console.log("business owner auth user:", businessOwner.email);

  const racheli = await ensureUser("rachelisharabi7@gmail.com");
  console.log("customer auth user (exists):", racheli.email);

  await admin
    .from("business_members")
    .delete()
    .eq("user_id", superAdmin.id);

  const { data: business, error: bizError } = await admin
    .from("businesses")
    .upsert(
      {
        name: "קליניקה אודליה",
        slug: "odelia-clinic",
        status: "active",
        description: "עיסוי רפואי, דיקור, רפלקסולוגיה ועוד",
        email: "eshbhnv@gmail.com",
        timezone: "Asia/Jerusalem",
        locale: "he",
        currency: "ILS",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (bizError) throw bizError;

  const businessId = business.id;
  console.log("business:", businessId);

  const { error: memberError } = await admin.from("business_members").upsert(
    {
      business_id: businessId,
      user_id: businessOwner.id,
      role: "business_owner",
      status: "active",
      permissions: {},
    },
    { onConflict: "business_id,user_id" },
  );
  if (memberError) throw memberError;
  console.log("business_owner membership linked");

  const { error: settingsError } = await admin.from("app_settings").upsert(
    {
      business_id: businessId,
      booking_window_days: 30,
      min_hours_before_booking: 2,
    },
    { onConflict: "business_id" },
  );
  if (settingsError) throw settingsError;

  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("email", "rachelisharabi7@gmail.com")
    .maybeSingle();

  if (!existingCustomer) {
    const { error: customerError } = await admin.from("customers").insert({
      business_id: businessId,
      full_name: "רחלי אלישarabi",
      email: "rachelisharabi7@gmail.com",
      notes: "לקוחה — רשומה CRM (לא קשורה אוטומטית להתחברות)",
    });
    if (customerError) throw customerError;
    console.log("customer record created for rachelisharabi7@gmail.com");
  } else {
    console.log("customer record already exists");
  }

  console.log("\nDone. Users must sign out and sign in again for JWT role refresh.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
