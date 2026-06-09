import "server-only";

import { getTwilioConfig } from "@/lib/env/server";
import { getDevInsecureFetch } from "@/lib/supabase/fetch-insecure";
import type { SmsProvider, SmsSendInput, SmsSendResult } from "./types";

type TwilioMessagesResponse = {
  sid?: string;
  message?: string;
  code?: number;
};

export class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  async send(input: SmsSendInput): Promise<SmsSendResult> {
    const config = getTwilioConfig();
    if (!config) {
      return { ok: false, provider: this.name, error: "twilio_not_configured" };
    }

    const body = new URLSearchParams({
      To: input.to,
      From: config.phoneNumber,
      Body: input.body,
    });

    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    try {
      const httpFetch = getDevInsecureFetch() ?? fetch;
      const response = await httpFetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const payload = (await response.json()) as TwilioMessagesResponse;

      if (!response.ok) {
        console.error("[sms] twilio_api_error", {
          httpStatus: response.status,
          code: payload.code ?? null,
          message: payload.message ?? null,
          to: `${input.to.slice(0, 4)}***`,
        });
        return {
          ok: false,
          provider: this.name,
          error: payload.message ?? `http_${response.status}`,
        };
      }

      if (!payload.sid) {
        console.error("[sms] twilio_api_error", {
          httpStatus: response.status,
          message: "missing_message_sid",
          to: `${input.to.slice(0, 4)}***`,
        });
        return { ok: false, provider: this.name, error: "missing_message_sid" };
      }

      console.info("[sms] twilio_accepted", {
        messageId: payload.sid,
        httpStatus: response.status,
        to: `${input.to.slice(0, 4)}***`,
      });

      return { ok: true, provider: this.name, messageId: payload.sid };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown_error";
      console.error("[sms] twilio_request_failed", {
        error: message,
        to: `${input.to.slice(0, 4)}***`,
      });
      return { ok: false, provider: this.name, error: message };
    }
  }
}
