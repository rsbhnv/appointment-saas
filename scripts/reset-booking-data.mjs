/**
 * Reset appointments, availability, customers, payments, and notification logs.
 *
 * Keeps: businesses, staff, services, settings, auth users.
 *
 * Preview only (default):
 *   node --env-file=.env.local scripts/reset-booking-data.mjs --slug=odelia-clinic
 *
 * Execute delete (irreversible):
 *   node --env-file=.env.local scripts/reset-booking-data.mjs --slug=odelia-clinic --confirm=YES
 *
 * All businesses (dangerous):
 *   node --env-file=.env.local scripts/reset-booking-data.mjs --all --confirm=YES
 */
import { createClient } from "@supabase/supabase-js";
import { Agent, fetch as undiciFetch } from "undici";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArgs(argv) {
  const args = { slug: null, all: false, confirm: false };
  for (const arg of argv) {
    if (arg === "--all") args.all = true;
    if (arg.startsWith("--slug=")) args.slug = arg.slice("--slug=".length);
    if (arg === "--confirm=YES") args.confirm = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!args.all && !args.slug) {
  console.error("Provide --slug=<business-slug> or --all");
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

const AUDIT_ENTITY_TYPES = [
  "appointment",
  "availability_rule",
  "availability_exception",
  "slot_override",
  "customer",
];

async function resolveBusinessIds() {
  let query = admin.from("businesses").select("id, slug, name");
  if (!args.all) query = query.eq("slug", args.slug);
  const { data, error } = await query;
  if (error) throw new Error(`businesses lookup failed: ${error.message}`);
  if (!data?.length) {
    throw new Error(
      args.all ? "No businesses found." : `Business not found: ${args.slug}`,
    );
  }
  return data;
}

async function countRows(table, businessIds, extraFilter) {
  let query = admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .in("business_id", businessIds);
  if (extraFilter) query = extraFilter(query);
  const { count, error } = await query;
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function preview(businessIds) {
  const tables = [
    "notification_logs",
    "payments",
    "appointments",
    "slot_overrides",
    "availability_exceptions",
    "availability_rules",
    "customers",
  ];

  console.log("\nPreview — rows to delete:\n");
  for (const table of tables) {
    const count = await countRows(table, businessIds);
    console.log(`  ${table.padEnd(26)} ${count}`);
  }

  const auditCount = await countRows("audit_logs", businessIds, (q) =>
    q.in("entity_type", AUDIT_ENTITY_TYPES),
  );
  console.log(`  ${"audit_logs (booking)".padEnd(26)} ${auditCount}`);
  console.log("");
}

async function deleteForBusinesses(businessIds) {
  const steps = [
    { table: "notification_logs" },
    { table: "payments" },
    { table: "appointments" },
    { table: "slot_overrides" },
    { table: "availability_exceptions" },
    { table: "availability_rules" },
    { table: "customers" },
  ];

  for (const { table } of steps) {
    const { error, count } = await admin
      .from(table)
      .delete({ count: "exact" })
      .in("business_id", businessIds);
    if (error) throw new Error(`${table} delete failed: ${error.message}`);
    console.log(`  deleted ${table}: ${count ?? "?"}`);
  }

  const { error: auditError, count: auditCount } = await admin
    .from("audit_logs")
    .delete({ count: "exact" })
    .in("business_id", businessIds)
    .in("entity_type", AUDIT_ENTITY_TYPES);
  if (auditError) {
    throw new Error(`audit_logs delete failed: ${auditError.message}`);
  }
  console.log(`  deleted audit_logs (booking): ${auditCount ?? "?"}`);
}

async function main() {
  const businesses = await resolveBusinessIds();
  const businessIds = businesses.map((b) => b.id);

  console.log("Target businesses:");
  for (const b of businesses) {
    console.log(`  - ${b.slug} (${b.name}) [${b.id}]`);
  }

  await preview(businessIds);

  if (!args.confirm) {
    console.log("Preview only. To delete, re-run with --confirm=YES");
    console.log(
      "Example: node --env-file=.env.local scripts/reset-booking-data.mjs --slug=odelia-clinic --confirm=YES",
    );
    return;
  }

  console.log("Deleting (irreversible)...\n");
  await deleteForBusinesses(businessIds);
  console.log("\nDone. Re-run without --confirm to verify counts are 0.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
