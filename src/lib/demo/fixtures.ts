/**
 * Demo-mode fixtures.
 *
 * These records simulate what the Supabase schema would return. They use the
 * same column names as the SQL migration so downstream code can switch to the
 * real client transparently.
 */
import type { MemberRole, Tables } from "@/types/database";

export const DEMO_USER_KEYS = ["super_admin", "business_owner", "staff"] as const;
export type DemoUserKey = (typeof DEMO_USER_KEYS)[number];

export function isDemoUserKey(value: unknown): value is DemoUserKey {
  return (
    typeof value === "string" && (DEMO_USER_KEYS as readonly string[]).includes(value)
  );
}

export const DEMO_USER_IDS: Record<DemoUserKey, string> = {
  super_admin: "00000000-0000-0000-0000-00000000d001",
  business_owner: "00000000-0000-0000-0000-00000000d002",
  staff: "00000000-0000-0000-0000-00000000d003",
};

export const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-00000000b001";

export type DemoSessionUser = {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  platformRole: "super_admin" | null;
};

export const DEMO_USERS: Record<DemoUserKey, DemoSessionUser> = {
  super_admin: {
    id: DEMO_USER_IDS.super_admin,
    email: "rachelly@example.dev",
    phone: null, // populated by demo credentials env in non-public contexts
    displayName: "רחלי שרעבי",
    platformRole: "super_admin",
  },
  business_owner: {
    id: DEMO_USER_IDS.business_owner,
    email: "efrat@example.dev",
    phone: null,
    displayName: "אפרת שר",
    platformRole: null,
  },
  staff: {
    id: DEMO_USER_IDS.staff,
    email: "demo-staff@example.dev",
    phone: null,
    displayName: "צוות הדגמה",
    platformRole: null,
  },
};

export const DEMO_BUSINESS: Tables<"businesses"> = {
  id: DEMO_BUSINESS_ID,
  name: "Demo Studio",
  slug: "demo-studio",
  industry_type: null,
  description: "עסק לדוגמה להצגת שלד הפלטפורמה.",
  phone: null,
  email: null,
  timezone: "Asia/Jerusalem",
  locale: "he",
  currency: "ILS",
  logo_url: null,
  primary_color: null,
  secondary_color: null,
  address: "רחוב הדגמה 1, תל אביב",
  arrival_instructions: null,
  payment_methods: "מזומן / ביט",
  theme_style: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export type DemoMembership = {
  userId: string;
  businessId: string;
  role: MemberRole;
};

export const DEMO_MEMBERSHIPS: readonly DemoMembership[] = [
  {
    userId: DEMO_USER_IDS.business_owner,
    businessId: DEMO_BUSINESS_ID,
    role: "business_owner",
  },
  {
    userId: DEMO_USER_IDS.staff,
    businessId: DEMO_BUSINESS_ID,
    role: "staff",
  },
];

/* ---------------------------------------------------------------------------
 * Phase 2 fixtures — services, staff, app settings
 * Each row is keyed by `business_id` so the demo store can enforce tenant
 * scoping the same way RLS will in production.
 * ------------------------------------------------------------------------- */

export const DEMO_SERVICE_SEED: ReadonlyArray<Tables<"services">> = [
  {
    id: "00000000-0000-0000-0000-00000000c001",
    business_id: DEMO_BUSINESS_ID,
    name: "ייעוץ ראשוני",
    description: "פגישת היכרות ואבחון צרכים.",
    duration_minutes: 45,
    price: 250,
    currency: "ILS",
    buffer_before_minutes: 0,
    buffer_after_minutes: 10,
    capacity: 1,
    requires_payment: false,
    deposit_amount: null,
    active: true,
    created_at: "2026-01-05T08:00:00.000Z",
    updated_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-00000000c002",
    business_id: DEMO_BUSINESS_ID,
    name: "טיפול המשך",
    description: "פגישת המשך בעקבות ייעוץ.",
    duration_minutes: 30,
    price: 180,
    currency: "ILS",
    buffer_before_minutes: 0,
    buffer_after_minutes: 5,
    capacity: 1,
    requires_payment: false,
    deposit_amount: null,
    active: true,
    created_at: "2026-01-05T08:05:00.000Z",
    updated_at: "2026-01-05T08:05:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-00000000c003",
    business_id: DEMO_BUSINESS_ID,
    name: "סדנה קבוצתית",
    description: "מפגש קבוצתי עד 6 משתתפים.",
    duration_minutes: 90,
    price: 120,
    currency: "ILS",
    buffer_before_minutes: 15,
    buffer_after_minutes: 15,
    capacity: 6,
    requires_payment: true,
    deposit_amount: 50,
    active: false,
    created_at: "2026-01-05T08:10:00.000Z",
    updated_at: "2026-01-05T08:10:00.000Z",
  },
];

export const DEMO_STAFF_SEED: ReadonlyArray<Tables<"staff_members">> = [
  {
    id: "00000000-0000-0000-0000-00000000e001",
    business_id: DEMO_BUSINESS_ID,
    user_id: DEMO_USER_IDS.business_owner,
    name: "אפרת שר",
    title: "בעלת העסק",
    phone: null,
    email: null,
    color: "#7c3aed",
    active: true,
    created_at: "2026-01-05T08:00:00.000Z",
    updated_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-00000000e002",
    business_id: DEMO_BUSINESS_ID,
    user_id: DEMO_USER_IDS.staff,
    name: "צוות הדגמה",
    title: "איש צוות",
    phone: null,
    email: null,
    color: "#06b6d4",
    active: true,
    created_at: "2026-01-05T08:05:00.000Z",
    updated_at: "2026-01-05T08:05:00.000Z",
  },
];

export const DEMO_SETTINGS_SEED: ReadonlyArray<Tables<"app_settings">> = [
  {
    id: "00000000-0000-0000-0000-00000000f001",
    business_id: DEMO_BUSINESS_ID,
    booking_window_days: 30,
    min_hours_before_booking: 2,
    max_appointments_per_customer_per_day: 1,
    allow_customer_cancellation: true,
    cancellation_min_hours: 4,
    default_slot_duration_minutes: 60,
    break_between_appointments_minutes: 15,
    confirmation_message:
      "תודה שקבעת תור! נשמח לראותך. אם תרצה לבטל — אפשר עד 4 שעות לפני המועד.",
    created_at: "2026-01-05T08:00:00.000Z",
    updated_at: "2026-01-05T08:00:00.000Z",
  },
];

export type DemoAuditEvent = {
  id: string;
  business_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const DEMO_AUDIT_SEED: readonly DemoAuditEvent[] = [
  {
    id: "00000000-0000-0000-0000-00000000a001",
    business_id: DEMO_BUSINESS_ID,
    user_id: DEMO_USER_IDS.business_owner,
    action: "business.created",
    entity_type: "businesses",
    entity_id: DEMO_BUSINESS_ID,
    metadata: { source: "seed" },
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-00000000a002",
    business_id: DEMO_BUSINESS_ID,
    user_id: DEMO_USER_IDS.business_owner,
    action: "member.added",
    entity_type: "business_members",
    entity_id: DEMO_USER_IDS.staff,
    metadata: { role: "staff" },
    created_at: "2026-01-02T08:30:00.000Z",
  },
];
