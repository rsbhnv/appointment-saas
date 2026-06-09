"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarCheck, CalendarPlus, List, Loader2, Plus } from "lucide-react";

import { BusinessBookingHeader } from "@/components/portal/business-booking-header";
import { AppointmentSummaryCard } from "@/components/portal/appointment-summary-card";
import { BookingMonthCalendar } from "@/components/portal/booking-month-calendar";
import { CustomerAppointmentsInline } from "@/components/portal/customer-appointments-inline";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formatArrivalLocation,
  formatBookingPrice,
  formatPaymentMethods,
} from "@/lib/booking/display-labels";
import { extractFirstName } from "@/lib/customer/name";
import {
  formatHebrewDate,
  formatHebrewTime,
  startOfMonth,
  toDateInputValue,
} from "@/lib/calendar/utils";
import { DEFAULT_CALENDAR_TIMEZONE, addDaysToDateInput, todayDateInTimezone } from "@/lib/calendar/timezone";
import {
  portalBtnPrimary,
  portalBtnSecondary,
  portalCard,
  portalCardInner,
  portalLandingBtnPrimary,
  portalLandingBtnSecondary,
  portalLandingCard,
  portalSectionSubtitle,
  portalSectionTitle,
  portalSlotChip,
  portalSlotChipActive,
  portalSlotChipIdle,
} from "@/lib/portal/styles";
import {
  bookCustomerAppointment,
  getAvailableSlotsForCustomerAction,
  getBookingMonthAvailabilityAction,
  identifyCustomerAction,
} from "@/server/actions/customer-booking";
import type { Service } from "@/server/repositories/services";
import type { StaffMember } from "@/server/repositories/staff-members";
import type { CustomerBookingSettings } from "@/components/portal/booking-types";
import { cn } from "@/lib/utils";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים. בדקו את השדות.",
  invalid_email: "כתובת מייל לא תקינה.",
  invalid_time: "יש לבחור תאריך ושעה עתידיים.",
  slot_unavailable: "השעה תפוסה. בחרו זמן אחר.",
  business_not_found: "העסק לא נמצא.",
  outside_booking_window: "התאריך מחוץ לחלון ההזמנה.",
  too_soon: "יש להזמין מראש לפי מדיניות העסק.",
  daily_limit_reached: "הגעתם למכסת התורים ליום זה.",
  booking_unavailable: "הזמנה אינה זמינה כרגע.",
  unknown: "לא הצלחנו לשמור את התור. נסו שוב.",
};

type Step = "landing" | "phone" | "home" | "my-appointments" | "schedule" | "register" | "success";

type PhoneIntent = "book" | "appointments";

type PublicBookingWizardProps = {
  businessSlug: string;
  businessName: string;
  businessDescription?: string | null;
  businessAddress?: string | null;
  arrivalInstructions?: string | null;
  paymentMethods?: string | null;
  businessCurrency?: string;
  businessTimezone?: string;
  logoUrl?: string | null;
  services: Service[];
  staff: StaffMember[];
  serviceNames: Record<string, string>;
  settings: CustomerBookingSettings;
};

type SuccessState = {
  customerName: string;
  startsAt: string;
  serviceName: string;
  priceLabel: string;
  arrivalLabel: string;
  paymentLabel: string;
};

type CustomerProfile = {
  known: boolean;
  firstName: string;
  fullName: string;
  email: string;
  smsConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
};

const EMPTY_PROFILE: CustomerProfile = {
  known: false,
  firstName: "",
  fullName: "",
  email: "",
  smsConsent: false,
  whatsappConsent: false,
  emailConsent: false,
};

function slotTimeKey(slot: { startsAt: string }): string {
  return slot.startsAt;
}

function dedupeTimeSlots<T extends { startsAt: string; endsAt: string }>(slots: T[]): T[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = slotTimeKey(slot);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function PublicBookingWizard({
  businessSlug,
  businessName,
  businessDescription,
  businessAddress,
  arrivalInstructions,
  paymentMethods,
  businessCurrency = "ILS",
  businessTimezone = DEFAULT_CALENDAR_TIMEZONE,
  logoUrl,
  services,
  staff,
  serviceNames,
  settings,
}: PublicBookingWizardProps) {
  const service = services[0] ?? null;
  const staffMember = staff[0] ?? null;

  const [step, setStep] = useState<Step>("landing");
  const [phoneIntent, setPhoneIntent] = useState<PhoneIntent>("book");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  const [anchorMonth, setAnchorMonth] = useState(() => startOfMonth(new Date()));
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<Array<{ startsAt: string; endsAt: string }>>([]);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const businessToday = useMemo(
    () => todayDateInTimezone(businessTimezone),
    [businessTimezone],
  );

  const maxDate = useMemo(
    () => addDaysToDateInput(businessToday, settings.bookingWindowDays, businessTimezone),
    [businessToday, settings.bookingWindowDays, businessTimezone],
  );

  const monthKey = useMemo(
    () => `${anchorMonth.getFullYear()}-${String(anchorMonth.getMonth() + 1).padStart(2, "0")}`,
    [anchorMonth],
  );

  const bookingSummary = useMemo(() => {
    if (!service) return null;

    const currency = service.currency || businessCurrency;
    return {
      serviceName: service.name,
      dateLabel: selectedDate ? formatHebrewDate(`${selectedDate}T12:00:00`) : "",
      timeLabel: selectedSlot ? formatHebrewTime(selectedSlot) : "",
      priceLabel: formatBookingPrice(service.price, currency),
      arrivalLabel: formatArrivalLocation(businessAddress, arrivalInstructions),
      paymentLabel: formatPaymentMethods(paymentMethods),
    };
  }, [
    service,
    businessCurrency,
    selectedDate,
    selectedSlot,
    businessAddress,
    arrivalInstructions,
    paymentMethods,
  ]);

  useEffect(() => {
    if (step !== "schedule" || !service || !staffMember) return;

    let cancelled = false;
    setLoadingMonth(true);
    setScheduleError(null);

    void (async () => {
      const result = await getBookingMonthAvailabilityAction({
        businessSlug,
        serviceId: service.id,
        staffMemberId: staffMember.id,
        month: monthKey,
      });
      if (cancelled) return;
      if (result.ok) {
        setAvailableDates(new Set(Array.isArray(result.dates) ? result.dates : []));
        setScheduleError(null);
      } else {
        setAvailableDates(new Set());
        setScheduleError("לא הצלחנו לטעון תאריכים פנויים. נסו שוב.");
      }
      setLoadingMonth(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [step, businessSlug, service?.id, staffMember?.id, monthKey]);

  useEffect(() => {
    if (!selectedDate || !service || !staffMember) {
      setSlots([]);
      setSelectedSlot("");
      setLoadingSlots(false);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    void (async () => {
      const result = await getAvailableSlotsForCustomerAction({
        businessSlug,
        serviceId: service.id,
        staffMemberId: staffMember.id,
        date: selectedDate,
      });
      if (cancelled) return;
      if (result.ok) {
        const uniqueSlots = dedupeTimeSlots(result.slots);
        setSlots(uniqueSlots);
        setSelectedSlot(uniqueSlots[0]?.startsAt ?? "");
      } else {
        setSlots([]);
        setSelectedSlot("");
      }
      setLoadingSlots(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [businessSlug, service?.id, staffMember?.id, selectedDate]);

  function applyProfileFromIdentify(customer: {
    found: boolean;
    firstName: string | null;
    fullName: string | null;
    email: string | null;
    smsConsent: boolean;
    whatsappConsent: boolean;
    emailConsent: boolean;
  }) {
    if (!customer.found) {
      setProfile(EMPTY_PROFILE);
      setFullName("");
      setEmail("");
      setSmsConsent(false);
      setWhatsappConsent(false);
      setEmailConsent(false);
      return;
    }

    const nextProfile: CustomerProfile = {
      known: true,
      firstName: customer.firstName ?? extractFirstName(customer.fullName ?? ""),
      fullName: customer.fullName ?? "",
      email: customer.email ?? "",
      smsConsent: customer.smsConsent,
      whatsappConsent: customer.whatsappConsent,
      emailConsent: customer.emailConsent,
    };
    setProfile(nextProfile);
    setFullName(nextProfile.fullName);
    setEmail(nextProfile.email);
    setSmsConsent(nextProfile.smsConsent);
    setWhatsappConsent(nextProfile.whatsappConsent);
    setEmailConsent(nextProfile.emailConsent);
  }

  function continueFromPhone() {
    setError(null);
    const trimmed = phone.trim();
    if (!trimmed) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    startTransition(async () => {
      const result = await identifyCustomerAction({ businessSlug, phone: trimmed });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }

      applyProfileFromIdentify(result.customer);

      if (phoneIntent === "appointments") {
        setStep("my-appointments");
        return;
      }

      if (result.customer.found) {
        setStep("home");
      } else {
        setStep("schedule");
      }
    });
  }

  function goToSchedule() {
    setError(null);
    setSelectedDate(null);
    setSelectedSlot("");
    setStep("schedule");
  }

  function continueToRegister() {
    if (!selectedDate || !selectedSlot) {
      setError(ERROR_COPY.invalid_input);
      return;
    }
    setError(null);
    setStep("register");
  }

  function submitBooking() {
    setError(null);
    if (!service || !staffMember || !selectedSlot || !fullName.trim() || !phone.trim()) {
      setError(ERROR_COPY.invalid_input);
      return;
    }

    startTransition(async () => {
      const result = await bookCustomerAppointment({
        businessSlug,
        serviceId: service.id,
        staffMemberId: staffMember.id,
        startsAt: selectedSlot,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        smsConsent,
        whatsappConsent,
        emailConsent,
      });

      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }

      setSuccess({
        customerName: fullName.trim(),
        startsAt: selectedSlot,
        serviceName: service.name,
        priceLabel: formatBookingPrice(service.price, service.currency || businessCurrency),
        arrivalLabel: formatArrivalLocation(businessAddress, arrivalInstructions),
        paymentLabel: formatPaymentMethods(paymentMethods),
      });
      setStep("success");
    });
  }

  function resetFlow() {
    setStep("landing");
    setPhoneIntent("book");
    setPhone("");
    setProfile(EMPTY_PROFILE);
    setFullName("");
    setEmail("");
    setSmsConsent(false);
    setWhatsappConsent(false);
    setEmailConsent(false);
    setSelectedDate(null);
    setSelectedSlot("");
    setSuccess(null);
    setError(null);
    setScheduleError(null);
  }

  function scheduleBackStep(): Step {
    if (profile.known) return "home";
    return "phone";
  }

  function myAppointmentsBackStep(): Step {
    if (profile.known) return "home";
    return phoneIntent === "appointments" ? "landing" : "phone";
  }

  function startPhoneStep(intent: PhoneIntent) {
    setPhoneIntent(intent);
    setError(null);
    setStep("phone");
  }

  if (!service || !staffMember) {
    return (
      <div className={cn(portalCard, portalCardInner, "text-sm text-on-surface-variant")}>
        <h2 className={portalSectionTitle}>הזמנת תור</h2>
        <p className={portalSectionSubtitle}>
          {services.length === 0 ? "טרם הוגדרו שירותים." : "טרם הוגדר צוות."}
        </p>
        <p className="pt-2">חזרו מאוחר יותר או צרו קשר ישירות עם {businessName}.</p>
      </div>
    );
  }

  if (step === "landing") {
    return (
      <div className={cn(portalLandingCard, "space-y-8")}>
        <BusinessBookingHeader
          name={businessName}
          description={businessDescription}
          logoUrl={logoUrl}
          variant="landing"
        />
        <div className="space-y-3">
          <Button
            type="button"
            variant="cta"
            size="xl"
            className={portalLandingBtnPrimary}
            onClick={() => startPhoneStep("book")}
          >
            <Plus className="size-5 shrink-0" strokeWidth={2.25} />
            קביעת תור חדש
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xl"
            className={portalLandingBtnSecondary}
            onClick={() => startPhoneStep("appointments")}
          >
            <List className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
            התורים שלי
          </Button>
        </div>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div className="space-y-6">
        <BusinessBookingHeader name={businessName} logoUrl={logoUrl} subtitle="זיהוי לקוח" />
        <div className={cn(portalCard, portalCardInner, "space-y-5")}>
          <div className="space-y-1">
            <h2 className={portalSectionTitle}>נא להזין מספר טלפון</h2>
            <p className={portalSectionSubtitle}>נשתמש במספר הטלפון לזיהוי ולניהול התורים</p>
          </div>
          <Field label="טלפון נייד" htmlFor="wizard-phone">
            <Input
              id="wizard-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="button"
              variant="cta"
              size="xl"
              className={portalBtnPrimary}
              disabled={isPending}
              onClick={continueFromPhone}
            >
              {isPending ? "בודק..." : "המשך"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={portalBtnSecondary}
              onClick={() => setStep("landing")}
            >
              חזרה
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "home") {
    return (
      <div className="space-y-6">
        <BusinessBookingHeader name={businessName} logoUrl={logoUrl} />
        <div className={cn(portalCard, portalCardInner, "space-y-6 text-center")}>
          <p className="text-2xl font-bold text-on-surface sm:text-3xl">
            שלום {profile.firstName || profile.fullName} 👋
          </p>
          <p className={portalSectionSubtitle}>מה תרצו לעשות?</p>
          <div className="grid gap-3">
            <Button
              type="button"
              variant="cta"
              size="xl"
              className={cn(portalBtnPrimary, "justify-center gap-3")}
              onClick={goToSchedule}
            >
              <CalendarPlus className="size-5 shrink-0" />
              קביעת תור חדש
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xl"
              className={cn(portalBtnSecondary, "justify-center gap-3")}
              onClick={() => setStep("my-appointments")}
            >
              <List className="size-5 shrink-0" />
              התורים שלי
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-on-surface-variant"
            onClick={() => setStep("landing")}
          >
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  if (step === "my-appointments") {
    return (
      <div className="space-y-6">
        <BusinessBookingHeader
          name={businessName}
          logoUrl={logoUrl}
          subtitle="התורים שלי"
        />
        <CustomerAppointmentsInline
          businessSlug={businessSlug}
          phone={phone}
          serviceNames={serviceNames}
          settings={settings}
        />
        <div className="flex flex-col gap-3">
          <Button type="button" variant="cta" size="xl" className={portalBtnPrimary} onClick={goToSchedule}>
            קביעת תור חדש
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={portalBtnSecondary}
            onClick={() => setStep(myAppointmentsBackStep())}
          >
            חזרה
          </Button>
        </div>
      </div>
    );
  }

  if (step === "schedule") {
    return (
      <div className="space-y-6">
        <BusinessBookingHeader name={businessName} logoUrl={logoUrl} subtitle="בחירת מועד" />
        <div className={cn(portalCard, portalCardInner, "space-y-6")}>
          <div className="space-y-1">
            <h2 className={portalSectionTitle}>בחרו מועד לטיפול</h2>
            <p className={portalSectionSubtitle}>
              {service.name} · {service.duration_minutes} דק׳
              {staffMember.name ? ` · ${staffMember.name}` : ""}
            </p>
          </div>

          <BookingMonthCalendar
            anchorMonth={anchorMonth}
            onAnchorMonthChange={setAnchorMonth}
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            minDate={businessToday}
            maxDate={maxDate}
            todayKey={businessToday}
            loading={loadingMonth}
          />

          {!loadingMonth && !scheduleError && availableDates.size === 0 ? (
            <p className="text-center text-sm text-on-surface-variant">
              אין תאריכים פנויים בחודש זה. נסו חודש אחר.
            </p>
          ) : null}

          {!loadingMonth &&
          !scheduleError &&
          availableDates.size > 0 &&
          !availableDates.has(businessToday) ? (
            <p className="text-center text-sm text-on-surface-variant">
              אין תורים פנויים להיום — נדרש להזמין לפחות{" "}
              {settings.minHoursBeforeBooking} שעות מראש.
            </p>
          ) : null}

          {scheduleError ? (
            <p className="text-sm text-destructive" role="alert">
              {scheduleError}
            </p>
          ) : null}

          {selectedDate ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-on-surface">
                שעות פנויות — {formatHebrewDate(`${selectedDate}T12:00:00`)}
              </p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Loader2 className="size-4 animate-spin" />
                  טוען שעות...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-on-surface-variant">אין שעות פנויות בתאריך זה.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slotTimeKey(slot)}
                      type="button"
                      className={cn(
                        portalSlotChip,
                        selectedSlot === slot.startsAt ? portalSlotChipActive : portalSlotChipIdle,
                      )}
                      onClick={() => setSelectedSlot(slot.startsAt)}
                    >
                      {formatHebrewTime(slot.startsAt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {service ? (
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-4">
              <p className="font-semibold text-on-surface">{service.name}</p>
              <p className="text-sm text-on-surface-variant">
                {service.duration_minutes} דקות ·{" "}
                {formatBookingPrice(service.price, service.currency || businessCurrency)}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="button"
              variant="cta"
              size="xl"
              className={portalBtnPrimary}
              disabled={!selectedSlot || isPending || loadingSlots}
              onClick={continueToRegister}
            >
              המשך
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={portalBtnSecondary}
              onClick={() => setStep(scheduleBackStep())}
            >
              חזרה
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "register") {
    return (
      <div className="space-y-6">
        <BusinessBookingHeader name={businessName} logoUrl={logoUrl} subtitle="פרטים ואישור" />
        <div className={cn(portalCard, portalCardInner, "space-y-5")}>
          <div className="space-y-1">
            <h2 className={portalSectionTitle}>
              {profile.known ? "אישור תור" : "השלמת פרטים"}
            </h2>
            <p className={portalSectionSubtitle}>בדקו את הפרטים לפני שמירת התור</p>
          </div>

          {bookingSummary ? (
            <AppointmentSummaryCard
              serviceName={bookingSummary.serviceName}
              dateLabel={bookingSummary.dateLabel}
              timeLabel={bookingSummary.timeLabel}
              priceLabel={bookingSummary.priceLabel}
              arrivalLabel={bookingSummary.arrivalLabel}
              paymentLabel={bookingSummary.paymentLabel}
            />
          ) : null}

          <div className="space-y-4">
            <p className="text-sm font-semibold text-on-surface">פרטים אישיים</p>
            <Field label="שם מלא" htmlFor="wizard-name">
              <Input
                id="wizard-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </Field>

            <Field label="טלפון נייד" htmlFor="wizard-phone-readonly">
              <Input
                id="wizard-phone-readonly"
                type="tel"
                value={phone}
                readOnly
                disabled
                className="bg-surface-container-low text-on-surface-variant"
                dir="ltr"
              />
            </Field>

            <Field label="כתובת אימייל (אופציונלי)" htmlFor="wizard-email">
              <Input
                id="wizard-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </Field>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-on-surface">
              העדפות יצירת קשר (אופציונלי)
            </legend>
            <div className="flex flex-wrap gap-2">
              <ConsentToggle
                id="consent-email"
                label="Email"
                checked={emailConsent}
                onChange={setEmailConsent}
              />
              <ConsentToggle
                id="consent-whatsapp"
                label="WhatsApp"
                checked={whatsappConsent}
                onChange={setWhatsappConsent}
              />
              <ConsentToggle
                id="consent-sms"
                label="SMS"
                checked={smsConsent}
                onChange={setSmsConsent}
              />
            </div>
          </fieldset>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="button"
              variant="cta"
              size="xl"
              className={portalBtnPrimary}
              disabled={isPending}
              onClick={submitBooking}
            >
              {isPending ? "שומר..." : "אישור והזמנה"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={portalBtnSecondary}
              onClick={() => setStep("schedule")}
            >
              חזרה
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(28,32,24,0.15)]">
          <CalendarCheck className="size-10" strokeWidth={2.5} />
        </div>
        <h2 className={portalSectionTitle}>התור נקבע בהצלחה</h2>
      </div>
      {success ? (
        <AppointmentSummaryCard
          title="פרטי התור"
          businessName={businessName}
          serviceName={success.serviceName}
          dateLabel={formatHebrewDate(success.startsAt)}
          timeLabel={formatHebrewTime(success.startsAt)}
          priceLabel={success.priceLabel}
          arrivalLabel={success.arrivalLabel}
          paymentLabel={success.paymentLabel}
        />
      ) : null}
      <div className="flex flex-col gap-3">
        <Button type="button" variant="cta" size="xl" className={portalBtnPrimary} onClick={resetFlow}>
          קביעת תור נוסף
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={portalBtnSecondary}
          onClick={() => {
            setPhoneIntent("appointments");
            setStep("my-appointments");
          }}
        >
          התורים שלי
        </Button>
      </div>
    </div>
  );
}

function ConsentToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "min-h-11 rounded-full border-2 px-5 text-sm font-semibold transition",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-outline-variant/25 bg-card text-on-surface hover:border-primary/30",
      )}
    >
      {label}
    </button>
  );
}
