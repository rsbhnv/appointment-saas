import { normalizePhone } from "@/lib/customer/phone";

/** Format stored phone for Twilio E.164 (+972…). */
export function formatPhoneE164(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const digits = normalizePhone(trimmed);
  if (digits.length < 11 || digits.length > 15) return null;

  return `+${digits}`;
}
