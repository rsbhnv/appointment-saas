"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AvailabilityCalendarTab } from "@/components/availability/availability-calendar-tab";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createAvailabilityRuleAction,
  createSlotBlockAction,
  deleteAvailabilityRuleAction,
  deleteSlotBlockAction,
  updateAvailabilityRuleAction,
} from "@/server/actions/availability";
import { updateBookingSettingsAction } from "@/server/actions/settings";
import type { AppSettings } from "@/server/repositories/app-settings";
import type {
  AvailabilityException,
  AvailabilityRule,
  SlotOverride,
} from "@/server/repositories/availability";
import type { StaffMember } from "@/server/repositories/staff-members";
import type {
  CalendarAppointment,
  CalendarAvailableSlot,
} from "@/lib/calendar/types";
import { toDateInputValue } from "@/lib/calendar/utils";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  forbidden: "אין הרשאה.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

const DAY_OPTIONS = [
  { value: 1, label: "יום ב׳" },
  { value: 2, label: "יום ג׳" },
  { value: 3, label: "יום ד׳" },
  { value: 4, label: "יום ה׳" },
  { value: 5, label: "יום ו׳" },
  { value: 6, label: "שבת" },
  { value: 7, label: "יום א׳" },
];

type Tab = "calendar" | "weekly" | "blocks";

type AvailabilityManagerProps = {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  blocks: SlotOverride[];
  staff: StaffMember[];
  canManage: boolean;
  canEditSlotSettings: boolean;
  settings: AppSettings | null;
  initialAppointments: CalendarAppointment[];
  initialAvailableSlots: CalendarAvailableSlot[];
};

export function AvailabilityManager({
  rules,
  exceptions,
  blocks,
  staff,
  canManage,
  canEditSlotSettings,
  settings,
  initialAppointments,
  initialAvailableSlots,
}: AvailabilityManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("calendar");
  const [error, setError] = useState<string | null>(null);
  const [slotSettingsMessage, setSlotSettingsMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [slotSettingsForm, setSlotSettingsForm] = useState({
    default_slot_duration_minutes: String(
      settings?.default_slot_duration_minutes ?? 60,
    ),
    break_between_appointments_minutes: String(
      settings?.break_between_appointments_minutes ?? 15,
    ),
  });

  const [ruleForm, setRuleForm] = useState({
    id: "" as string | "",
    staff_member_id: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "17:00",
    active: true,
  });

  const [blockForm, setBlockForm] = useState({
    staff_member_id: "",
    date: toDateInputValue(new Date()),
    start_time: "12:00",
    end_time: "13:00",
    reason: "",
  });

  function staffOptions(allLabel: string) {
    return (
      <>
        <option value="">{allLabel}</option>
        {staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </>
    );
  }

  function submitRule() {
    setError(null);
    const payload = {
      staff_member_id: ruleForm.staff_member_id || null,
      day_of_week: Number(ruleForm.day_of_week),
      start_time: ruleForm.start_time,
      end_time: ruleForm.end_time,
      active: ruleForm.active,
      ...(ruleForm.id ? { id: ruleForm.id } : {}),
    };
    startTransition(async () => {
      const result = ruleForm.id
        ? await updateAvailabilityRuleAction(payload)
        : await createAvailabilityRuleAction(payload);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      router.refresh();
    });
  }

  function submitBlock() {
    setError(null);
    const startsAt = new Date(`${blockForm.date}T${blockForm.start_time}`);
    const endsAt = new Date(`${blockForm.date}T${blockForm.end_time}`);
    startTransition(async () => {
      const result = await createSlotBlockAction({
        staff_member_id: blockForm.staff_member_id || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        reason: blockForm.reason || null,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      router.refresh();
    });
  }

  function submitSlotSettings() {
    setError(null);
    setSlotSettingsMessage(null);
    startTransition(async () => {
      const result = await updateBookingSettingsAction({
        booking_window_days: settings?.booking_window_days ?? 30,
        min_hours_before_booking: settings?.min_hours_before_booking ?? 2,
        max_appointments_per_customer_per_day:
          settings?.max_appointments_per_customer_per_day ?? 1,
        allow_customer_cancellation: settings?.allow_customer_cancellation ?? true,
        cancellation_min_hours: settings?.cancellation_min_hours ?? 4,
        confirmation_message: settings?.confirmation_message ?? null,
        default_slot_duration_minutes: Number(
          slotSettingsForm.default_slot_duration_minutes,
        ),
        break_between_appointments_minutes: Number(
          slotSettingsForm.break_between_appointments_minutes,
        ),
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setSlotSettingsMessage("הגדרות הסלוטים נשמרו.");
      router.refresh();
    });
  }

  function removeRule(id: string) {
    if (!window.confirm("למחוק את הכלל?")) return;
    startTransition(async () => {
      const result = await deleteAvailabilityRuleAction({ id });
      if (!result.ok) setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
      else router.refresh();
    });
  }

  function removeBlock(id: string) {
    if (!window.confirm("למחוק את החסימה?")) return;
    startTransition(async () => {
      const result = await deleteSlotBlockAction({ id });
      if (!result.ok) setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>הגדרות סלוטים ליומן</CardTitle>
          <CardDescription>
            משך סלוט והפסקה בין תורים — חלים על כל טווחי העבודה (שבועיים ולפי תאריך).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="משך סלוט ברירת מחדל (דקות)">
            <Input
              type="number"
              min={5}
              max={480}
              value={slotSettingsForm.default_slot_duration_minutes}
              disabled={!canEditSlotSettings}
              onChange={(e) =>
                setSlotSettingsForm((form) => ({
                  ...form,
                  default_slot_duration_minutes: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="הפסקה בין תורים (דקות)">
            <Input
              type="number"
              min={0}
              max={240}
              value={slotSettingsForm.break_between_appointments_minutes}
              disabled={!canEditSlotSettings}
              onChange={(e) =>
                setSlotSettingsForm((form) => ({
                  ...form,
                  break_between_appointments_minutes: e.target.value,
                }))
              }
            />
          </Field>
          {slotSettingsMessage ? (
            <p className="text-sm text-primary sm:col-span-2" role="status">
              {slotSettingsMessage}
            </p>
          ) : null}
          {canEditSlotSettings ? (
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="cta"
                disabled={isPending}
                onClick={submitSlotSettings}
              >
                שמירת הגדרות סלוטים
              </Button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant sm:col-span-2">
              רק בעל/ת העסק יכול/ה לערוך את משך הסלוט וההפסקה.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["calendar", "לוח חודשי"],
            ["weekly", "שעות שבועיות"],
            ["blocks", "חסימות"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tab === key ? "cta" : "outline"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {tab === "calendar" ? (
        <AvailabilityCalendarTab
          exceptions={exceptions}
          staff={staff}
          canManage={canManage}
          initialAppointments={initialAppointments}
          initialAvailableSlots={initialAvailableSlots}
        />
      ) : null}

      {tab === "weekly" ? (
        <>
          {canManage ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="size-5" aria-hidden />
                  {ruleForm.id ? "עריכת כלל שבועי" : "כלל שבועי חדש"}
                </CardTitle>
                <CardDescription>
                  חל על כל השבועות, אלא אם הוגדרה זמינות לפי תאריך בלוח החודשי.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <Field label="איש צוות (אופציונלי)">
                  <select
                    className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                    value={ruleForm.staff_member_id}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, staff_member_id: e.target.value }))
                    }
                  >
                    {staffOptions("כל הצוות")}
                  </select>
                </Field>
                <Field label="יום">
                  <select
                    className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                    value={ruleForm.day_of_week}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, day_of_week: e.target.value }))
                    }
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day.value} value={String(day.value)}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="התחלה">
                  <Input
                    type="time"
                    value={ruleForm.start_time}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, start_time: e.target.value }))
                    }
                  />
                </Field>
                <Field label="סיום">
                  <Input
                    type="time"
                    value={ruleForm.end_time}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={ruleForm.active}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, active: e.target.checked }))
                    }
                  />
                  פעיל
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    variant="cta"
                    disabled={isPending}
                    onClick={submitRule}
                  >
                    {ruleForm.id ? "עדכון" : "הוספה"}
                  </Button>
                  {ruleForm.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setRuleForm({
                          id: "",
                          staff_member_id: "",
                          day_of_week: "1",
                          start_time: "09:00",
                          end_time: "17:00",
                          active: true,
                        })
                      }
                    >
                      ביטול עריכה
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>כללים שבועיים</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-outline-variant/20 p-0">
              {rules.length === 0 ? (
                <p className="px-6 py-4 text-sm text-on-surface-variant">
                  אין כללים — ברירת מחדל 09:00–20:00 ביומן.
                </p>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {DAY_OPTIONS.find((d) => d.value === rule.day_of_week)?.label ??
                          rule.day_of_week}{" "}
                        · {rule.start_time.slice(0, 5)}–{rule.end_time.slice(0, 5)}
                      </p>
                      <p className="text-on-surface-variant">
                        {rule.staff_member_id
                          ? staff.find((s) => s.id === rule.staff_member_id)?.name ??
                            "צוות"
                          : "כל הצוות"}
                        {!rule.active ? " · לא פעיל" : ""}
                      </p>
                    </div>
                    {canManage ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRuleForm({
                              id: rule.id,
                              staff_member_id: rule.staff_member_id ?? "",
                              day_of_week: String(rule.day_of_week),
                              start_time: rule.start_time.slice(0, 5),
                              end_time: rule.end_time.slice(0, 5),
                              active: rule.active,
                            })
                          }
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeRule(rule.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {tab === "blocks" ? (
        <>
          {canManage ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>חסימת זמן / הפסקה</CardTitle>
                <CardDescription>
                  מונע קביעת תורים בטווח הנבחר (למשל הפסקת צהריים).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <Field label="תאריך">
                  <Input
                    type="date"
                    value={blockForm.date}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </Field>
                <Field label="איש צוות (אופציונלי)">
                  <select
                    className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                    value={blockForm.staff_member_id}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, staff_member_id: e.target.value }))
                    }
                  >
                    {staffOptions("כל הצוות")}
                  </select>
                </Field>
                <Field label="מ">
                  <Input
                    type="time"
                    value={blockForm.start_time}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, start_time: e.target.value }))
                    }
                  />
                </Field>
                <Field label="עד">
                  <Input
                    type="time"
                    value={blockForm.end_time}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                  />
                </Field>
                <Field label="סיבה" className="sm:col-span-2">
                  <Input
                    value={blockForm.reason}
                    onChange={(e) =>
                      setBlockForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </Field>
                <Button type="button" variant="cta" disabled={isPending} onClick={submitBlock}>
                  הוספת חסימה
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>חסימות פעילות</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-outline-variant/20 p-0">
              {blocks.length === 0 ? (
                <p className="px-6 py-4 text-sm text-on-surface-variant">אין חסימות.</p>
              ) : (
                blocks.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatRange(row.starts_at, row.ends_at)}</p>
                      <p className="text-on-surface-variant">
                        {row.staff_member_id
                          ? staff.find((s) => s.id === row.staff_member_id)?.name
                          : "כל הצוות"}
                        {row.reason ? ` · ${row.reason}` : ""}
                      </p>
                    </div>
                    {canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeBlock(row.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {!canManage ? (
        <p className="text-sm text-on-surface-variant">
          צפייה בלבד — רק מנהל/ת עסק יכול/ה לערוך זמינות.
        </p>
      ) : null}
    </div>
  );
}

function formatRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
