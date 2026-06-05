import "server-only";

import { formatHebrewDate, formatHebrewTime } from "@/lib/calendar/utils";
import { isDemoMode } from "@/lib/env/client";
import { isTwilioConfigured } from "@/lib/env/server";
import { canSendSms, preferencesFromCustomer } from "@/lib/notifications/preferences";
import { formatPhoneE164 } from "@/lib/notifications/phone-e164";
import { customerMyAppointmentsUrl } from "@/lib/tenant/customer-portal-paths";
import {
  loadAppointmentSmsContext,
  listAppointmentsDueForReminder,
  markAppointmentReminderSent,
} from "@/server/repositories/appointment-notifications";
import { sendSms } from "@/server/notifications/sms/sms.service";
import {
  buildAppointmentReminderSms,
  buildBookingConfirmationSms,
} from "@/server/notifications/sms/templates";

type SmsLogContext = {
  type: "booking_confirmation" | "appointment_reminder";
  appointmentId: string;
  businessId: string;
};

function logSmsSkipped(reason: string, ctx: SmsLogContext): void {
  console.info("[sms] skipped", { reason, ...ctx });
}

function logSmsSuccess(ctx: SmsLogContext, messageId: string, provider: string): void {
  console.info("[sms] sent", { ...ctx, messageId, provider });
}

function logSmsFailure(ctx: SmsLogContext, error: string, provider: string): void {
  console.error("[sms] failed", { ...ctx, error, provider });
}

type DeliverResult = "sent" | "skipped" | "failed";

async function deliverSms(
  ctx: SmsLogContext,
  phone: string | null,
  smsConsent: boolean,
  body: string,
): Promise<DeliverResult> {
  if (isDemoMode) {
    logSmsSkipped("demo_mode", ctx);
    return "skipped";
  }

  if (!isTwilioConfigured()) {
    logSmsSkipped("twilio_not_configured", ctx);
    return "skipped";
  }

  if (!canSendSms(preferencesFromCustomer({ sms_consent: smsConsent }))) {
    logSmsSkipped("sms_consent_disabled", ctx);
    return "skipped";
  }

  const e164 = phone ? formatPhoneE164(phone) : null;
  if (!e164) {
    logSmsSkipped("invalid_phone", ctx);
    return "skipped";
  }

  const result = await sendSms({ to: e164, body });
  if (!result.ok) {
    logSmsFailure(ctx, result.error, result.provider);
    return "failed";
  }

  logSmsSuccess(ctx, result.messageId, result.provider);
  return "sent";
}

/** Fire-and-forget booking confirmation SMS after appointment is saved. */
export function scheduleBookingConfirmationSms(appointmentId: string): void {
  void sendBookingConfirmationSms(appointmentId).catch((err) => {
    console.error("[sms] booking_confirmation_unhandled", {
      appointmentId,
      error: err instanceof Error ? err.message : "unknown",
    });
  });
}

export async function sendBookingConfirmationSms(appointmentId: string): Promise<void> {
  const context = await loadAppointmentSmsContext(appointmentId);
  if (!context) {
    console.warn("[sms] booking_confirmation_context_missing", { appointmentId });
    return;
  }

  const logCtx: SmsLogContext = {
    type: "booking_confirmation",
    appointmentId: context.appointmentId,
    businessId: context.businessId,
  };

  const body = buildBookingConfirmationSms({
    customerFirstName: context.customerFirstName,
    businessName: context.businessName,
    serviceName: context.serviceName,
    appointmentDate: formatHebrewDate(context.startsAt),
    appointmentTime: formatHebrewTime(context.startsAt),
    manageAppointmentUrl: customerMyAppointmentsUrl(context.businessSlug),
  });

  await deliverSms(logCtx, context.customerPhone, context.smsConsent, body);
}

export async function processAppointmentReminders(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  const rows = await listAppointmentsDueForReminder();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const context of rows) {
    const logCtx: SmsLogContext = {
      type: "appointment_reminder",
      appointmentId: context.appointmentId,
      businessId: context.businessId,
    };

    const body = buildAppointmentReminderSms({
      customerFirstName: context.customerFirstName,
      businessName: context.businessName,
      serviceName: context.serviceName,
      appointmentDate: formatHebrewDate(context.startsAt),
      appointmentTime: formatHebrewTime(context.startsAt),
    });

    const outcome = await deliverSms(logCtx, context.customerPhone, context.smsConsent, body);
    if (outcome === "skipped") {
      skipped += 1;
      continue;
    }
    if (outcome === "failed") {
      failed += 1;
      continue;
    }

    const marked = await markAppointmentReminderSent(context.businessId, context.appointmentId);
    if (marked) {
      sent += 1;
    } else {
      skipped += 1;
      console.info("[sms] reminder_already_sent", logCtx);
    }
  }

  console.info("[sms] reminder_batch_complete", {
    scanned: rows.length,
    sent,
    skipped,
    failed,
  });

  return { scanned: rows.length, sent, skipped, failed };
}
