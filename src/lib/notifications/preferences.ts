/** Customer notification channel preferences (future-ready). */
export type NotificationChannel = "sms" | "whatsapp" | "email";

export type CustomerNotificationPreferences = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
};

export function preferencesFromCustomer(row: {
  sms_consent?: boolean | null;
  whatsapp_consent?: boolean | null;
  email_consent?: boolean | null;
}): CustomerNotificationPreferences {
  return {
    sms: row.sms_consent ?? false,
    whatsapp: row.whatsapp_consent ?? false,
    email: row.email_consent ?? false,
  };
}

export function canSendSms(preferences: CustomerNotificationPreferences): boolean {
  return preferences.sms;
}
