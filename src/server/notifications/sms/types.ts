import "server-only";

export type SmsSendInput = {
  to: string;
  body: string;
};

export type SmsSendResult =
  | { ok: true; provider: string; messageId: string }
  | { ok: false; provider: string; error: string };

/** Pluggable SMS provider (Twilio today; others later). */
export interface SmsProvider {
  readonly name: string;
  send(input: SmsSendInput): Promise<SmsSendResult>;
}
