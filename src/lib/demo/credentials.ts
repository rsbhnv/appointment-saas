import "server-only";

import {
  DEMO_USERS,
  DEMO_USER_KEYS,
  type DemoUserKey,
} from "@/lib/demo/fixtures";

export type DemoCredentialedRole = {
  key: DemoUserKey;
  phone: string;
  displayName: string;
};

type CredentialSlot = {
  key: DemoUserKey;
  phoneEnv: string | undefined;
  passwordEnv: string | undefined;
};

const CREDENTIAL_SLOTS: CredentialSlot[] = [
  {
    key: "super_admin",
    phoneEnv: process.env.DEMO_SUPER_ADMIN_PHONE,
    passwordEnv: process.env.DEMO_SUPER_ADMIN_PASSWORD,
  },
  {
    key: "business_owner",
    phoneEnv: process.env.DEMO_BUSINESS_OWNER_PHONE,
    passwordEnv: process.env.DEMO_BUSINESS_OWNER_PASSWORD,
  },
  {
    key: "staff",
    phoneEnv: process.env.DEMO_STAFF_PHONE,
    passwordEnv: process.env.DEMO_STAFF_PASSWORD,
  },
];

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

/** Roles with both phone and password configured in env. */
export function getDemoCredentialedRoles(): DemoCredentialedRole[] {
  return CREDENTIAL_SLOTS.flatMap((slot) => {
    const phone = slot.phoneEnv?.trim();
    const password = slot.passwordEnv;
    if (!phone || !password) return [];
    return [
      {
        key: slot.key,
        phone,
        displayName: DEMO_USERS[slot.key].displayName,
      },
    ];
  });
}

/**
 * Returns the matching demo role key, or null when credentials do not match
 * any configured slot.
 */
export function verifyDemoCredentials(
  phone: string,
  password: string,
): DemoUserKey | null {
  const normalizedPhone = normalizePhone(phone);

  for (const slot of CREDENTIAL_SLOTS) {
    const slotPhone = slot.phoneEnv?.trim();
    const slotPassword = slot.passwordEnv;
    if (!slotPhone || !slotPassword) continue;
    if (
      normalizePhone(slotPhone) === normalizedPhone &&
      slotPassword === password
    ) {
      return slot.key;
    }
  }

  return null;
}

export { DEMO_USER_KEYS };
