"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { customerBookingPath, customerBookingUrl } from "@/lib/tenant/customer-portal-paths";
import {
  updateBookingSettingsAction,
  updateBusinessProfileAction,
} from "@/server/actions/settings";
import type { AppSettings } from "@/server/repositories/app-settings";
import type { Business } from "@/server/repositories/businesses";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  forbidden: "רק בעל העסק יכול לעדכן הגדרות.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type SettingsFormsProps = {
  business: Business;
  settings: AppSettings | null;
  canEdit: boolean;
};

export function SettingsForms({ business, settings, canEdit }: SettingsFormsProps) {
  const [profile, setProfile] = useState({
    name: business.name,
    phone: business.phone ?? "",
    email: business.email ?? "",
    description: business.description ?? "",
    timezone: business.timezone,
    address: business.address ?? "",
    arrival_instructions: business.arrival_instructions ?? "",
    payment_methods: business.payment_methods ?? "",
  });
  const [booking, setBooking] = useState({
    booking_window_days: String(settings?.booking_window_days ?? 30),
    min_hours_before_booking: String(settings?.min_hours_before_booking ?? 2),
    max_appointments_per_customer_per_day: String(
      settings?.max_appointments_per_customer_per_day ?? 1,
    ),
    allow_customer_cancellation: settings?.allow_customer_cancellation ?? true,
    cancellation_min_hours: String(settings?.cancellation_min_hours ?? 4),
    default_slot_duration_minutes: String(
      settings?.default_slot_duration_minutes ?? 60,
    ),
    break_between_appointments_minutes: String(
      settings?.break_between_appointments_minutes ?? 15,
    ),
    confirmation_message: settings?.confirmation_message ?? "",
  });
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isBookingPending, startBookingTransition] = useTransition();

  function saveProfile() {
    setProfileError(null);
    setProfileMsg(null);
    startProfileTransition(async () => {
      const result = await updateBusinessProfileAction(profile);
      if (!result.ok) {
        setProfileError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setProfileMsg("פרופיל העסק נשמר.");
    });
  }

  function saveBooking() {
    setBookingError(null);
    setBookingMsg(null);
    startBookingTransition(async () => {
      const result = await updateBookingSettingsAction({
        booking_window_days: Number(booking.booking_window_days),
        min_hours_before_booking: Number(booking.min_hours_before_booking),
        max_appointments_per_customer_per_day: Number(
          booking.max_appointments_per_customer_per_day,
        ),
        allow_customer_cancellation: booking.allow_customer_cancellation,
        cancellation_min_hours: Number(booking.cancellation_min_hours),
        default_slot_duration_minutes: Number(booking.default_slot_duration_minutes),
        break_between_appointments_minutes: Number(
          booking.break_between_appointments_minutes,
        ),
        confirmation_message: booking.confirmation_message || null,
      });
      if (!result.ok) {
        setBookingError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setBookingMsg("הגדרות הזמנה נשמרו.");
    });
  }

  const customerPortalPath = customerBookingPath(business.slug);
  const customerPortalUrl = customerBookingUrl(business.slug);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>אזור לקוחות</CardTitle>
          <CardDescription>
            קישור להזמנת תור. לבדיקה כלקוח/ה — התנתקו מלוח הבקרה והתחברו דרך הקישור.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <ButtonLink href={customerPortalPath} variant="cta" target="_blank" rel="noopener">
            פתיחת דף הזמנה ללקוחות
          </ButtonLink>
          <Link
            href={customerPortalPath}
            className="text-sm font-medium text-primary hover:underline"
          >
            {customerPortalUrl}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>פרופיל עסק</CardTitle>
          <CardDescription>שם, יצירת קשר ואזור זמן</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Field label="שם העסק" htmlFor="business-name">
            <Input
              id="business-name"
              value={profile.name}
              disabled={!canEdit}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </Field>
          <Field label="אזור זמן" htmlFor="business-timezone">
            <Input
              id="business-timezone"
              value={profile.timezone}
              disabled={!canEdit}
              onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
            />
          </Field>
          <Field label="טלפון" htmlFor="business-phone">
            <Input
              id="business-phone"
              value={profile.phone}
              disabled={!canEdit}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </Field>
          <Field label="אימייל" htmlFor="business-email">
            <Input
              id="business-email"
              type="email"
              value={profile.email}
              disabled={!canEdit}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
          <Field label="תיאור" htmlFor="business-description" className="md:col-span-2">
            <Input
              id="business-description"
              value={profile.description}
              disabled={!canEdit}
              onChange={(e) =>
                setProfile((p) => ({ ...p, description: e.target.value }))
              }
            />
          </Field>
          <Field label="כתובת העסק" htmlFor="business-address" className="md:col-span-2">
            <Input
              id="business-address"
              value={profile.address}
              disabled={!canEdit}
              placeholder="רחוב, עיר"
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
            />
          </Field>
          <Field label="הוראות הגעה" htmlFor="business-arrival" className="md:col-span-2">
            <textarea
              id="business-arrival"
              rows={2}
              value={profile.arrival_instructions}
              disabled={!canEdit}
              placeholder="לדוגמה: קומה 2, כניסה מצד ימין"
              onChange={(e) =>
                setProfile((p) => ({ ...p, arrival_instructions: e.target.value }))
              }
              className="flex min-h-[4.5rem] w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-base text-on-surface transition-all placeholder:text-outline/50 input-focus-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
            />
          </Field>
          <Field label="אופן תשלום" htmlFor="business-payment" className="md:col-span-2">
            <textarea
              id="business-payment"
              rows={2}
              value={profile.payment_methods}
              disabled={!canEdit}
              placeholder="לדוגמה: מזומן / ביט / העברה בנקאית"
              onChange={(e) =>
                setProfile((p) => ({ ...p, payment_methods: e.target.value }))
              }
              className="flex min-h-[4.5rem] w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-base text-on-surface transition-all placeholder:text-outline/50 input-focus-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
            />
          </Field>
          {profileError ? (
            <p className="text-sm text-destructive md:col-span-2" role="alert">
              {profileError}
            </p>
          ) : null}
          {profileMsg ? (
            <p className="text-sm text-primary md:col-span-2" role="status">
              {profileMsg}
            </p>
          ) : null}
          {canEdit ? (
            <div className="md:col-span-2">
              <Button type="button" disabled={isProfilePending} onClick={saveProfile}>
                שמירת פרופיל
              </Button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant md:col-span-2">
              רק בעל העסק יכול לערוך פרופיל.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>הגדרות הזמנה</CardTitle>
          <CardDescription>חלונות זמן ומדיניות ביטול (ללא מנוע תורים פעיל)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Field label="חלון הזמנה (ימים)" htmlFor="booking-window">
            <Input
              id="booking-window"
              type="number"
              min={1}
              max={365}
              value={booking.booking_window_days}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({ ...b, booking_window_days: e.target.value }))
              }
            />
          </Field>
          <Field label="מינימום שעות לפני תור" htmlFor="min-hours">
            <Input
              id="min-hours"
              type="number"
              min={0}
              value={booking.min_hours_before_booking}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({ ...b, min_hours_before_booking: e.target.value }))
              }
            />
          </Field>
          <Field label="מקסימום תורים ללקוח ביום" htmlFor="max-per-day">
            <Input
              id="max-per-day"
              type="number"
              min={1}
              value={booking.max_appointments_per_customer_per_day}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({
                  ...b,
                  max_appointments_per_customer_per_day: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="שעות מינימום לביטול" htmlFor="cancel-hours">
            <Input
              id="cancel-hours"
              type="number"
              min={0}
              value={booking.cancellation_min_hours}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({ ...b, cancellation_min_hours: e.target.value }))
              }
            />
          </Field>
          <Field label="משך סלוט ברירת מחדל (דקות)" htmlFor="default-slot-duration">
            <Input
              id="default-slot-duration"
              type="number"
              min={5}
              max={480}
              value={booking.default_slot_duration_minutes}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({
                  ...b,
                  default_slot_duration_minutes: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="הפסקה בין תורים (דקות)" htmlFor="slot-break">
            <Input
              id="slot-break"
              type="number"
              min={0}
              max={240}
              value={booking.break_between_appointments_minutes}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({
                  ...b,
                  break_between_appointments_minutes: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="הודעת אישור" htmlFor="confirmation-message" className="md:col-span-2">
            <Input
              id="confirmation-message"
              value={booking.confirmation_message}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({ ...b, confirmation_message: e.target.value }))
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
            <input
              type="checkbox"
              checked={booking.allow_customer_cancellation}
              disabled={!canEdit}
              onChange={(e) =>
                setBooking((b) => ({
                  ...b,
                  allow_customer_cancellation: e.target.checked,
                }))
              }
            />
            לאפשר ביטול על ידי לקוח
          </label>
          {bookingError ? (
            <p className="text-sm text-destructive md:col-span-2" role="alert">
              {bookingError}
            </p>
          ) : null}
          {bookingMsg ? (
            <p className="text-sm text-primary md:col-span-2" role="status">
              {bookingMsg}
            </p>
          ) : null}
          {canEdit ? (
            <div className="md:col-span-2">
              <Button type="button" disabled={isBookingPending} onClick={saveBooking}>
                שמירת הגדרות
              </Button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant md:col-span-2">
              רק בעל העסק יכול לערוך הגדרות הזמנה.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
