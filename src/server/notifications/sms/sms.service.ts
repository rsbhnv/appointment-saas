import "server-only";

import { isTwilioConfigured } from "@/lib/env/server";

import { TwilioSmsProvider } from "./twilio.provider";
import type { SmsProvider, SmsSendInput, SmsSendResult } from "./types";

let cachedProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider | null {
  if (!isTwilioConfigured()) return null;
  if (!cachedProvider) {
    cachedProvider = new TwilioSmsProvider();
  }
  return cachedProvider;
}

export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
  const provider = getSmsProvider();
  if (!provider) {
    return { ok: false, provider: "none", error: "sms_provider_not_configured" };
  }
  return provider.send(input);
}
