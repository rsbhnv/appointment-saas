"use client";

import { Plus, Trash2 } from "lucide-react";

import { RANGE_ERROR_COPY, type TimeRangeInput } from "@/lib/availability/ranges";
import { formatHebrewDate } from "@/lib/calendar/utils";
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
import type { StaffMember } from "@/server/repositories/staff-members";

type AvailabilityDateEditorProps = {
  selectedDates: string[];
  ranges: TimeRangeInput[];
  closed: boolean;
  staffMemberId: string;
  staff: StaffMember[];
  canManage: boolean;
  isPending: boolean;
  error: string | null;
  mixedSelection: boolean;
  onRangesChange: (ranges: TimeRangeInput[]) => void;
  onClosedChange: (closed: boolean) => void;
  onStaffChange: (staffMemberId: string) => void;
  onSave: () => void;
  onUseWeekly: () => void;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
};

export function AvailabilityDateEditor({
  selectedDates,
  ranges,
  closed,
  staffMemberId,
  staff,
  canManage,
  isPending,
  error,
  mixedSelection,
  onRangesChange,
  onClosedChange,
  onStaffChange,
  onSave,
  onUseWeekly,
  onAddRange,
  onRemoveRange,
}: AvailabilityDateEditorProps) {
  const sortedDates = [...selectedDates].sort((a, b) => a.localeCompare(b));

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <CardHeader className="border-b">
        <CardTitle>עריכת זמינות לתאריכים</CardTitle>
        <CardDescription>
          זמינות לפי תאריך דורסת את השעות השבועיות לימים שנבחרו. הפסקות נקודתיות
          נשארות בלשונית חסימות.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {selectedDates.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            בחרו יום אחד או יותר בלוח החודש כדי להגדיר טווחי שעות.
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-medium text-on-surface-variant">
                תאריכים נבחרים ({selectedDates.length})
              </p>
              <ul className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {sortedDates.map((date) => (
                  <li
                    key={date}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                  >
                    {formatHebrewDate(`${date}T12:00:00`)}
                  </li>
                ))}
              </ul>
            </div>

            {mixedSelection ? (
              <p className="rounded-lg bg-secondary/10 px-3 py-2 text-xs text-secondary">
                לתאריכים שנבחרו יש הגדרות שונות. שמירה תחיל את אותם טווחים על כל
                התאריכים.
              </p>
            ) : null}

            {canManage ? (
              <>
                <Field label="איש צוות (אופציונלי)">
                  <select
                    className="flex h-10 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                    value={staffMemberId}
                    onChange={(e) => onStaffChange(e.target.value)}
                  >
                    <option value="">כל הצוות / הקליניקה</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={(e) => onClosedChange(e.target.checked)}
                  />
                  סגור כל היום (ללא זמינות)
                </label>

                {!closed ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-on-surface">
                        טווחי שעות עבודה
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onAddRange}
                      >
                        <Plus className="size-4" aria-hidden />
                        הוסף טווח
                      </Button>
                    </div>
                    {ranges.map((range, index) => (
                      <div
                        key={index}
                        className="space-y-2 rounded-lg border border-outline-variant/20 p-3 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-2 sm:space-y-0"
                      >
                        <Field label="התחלה">
                          <Input
                            type="time"
                            value={range.start_time}
                            onChange={(e) => {
                              const next = [...ranges];
                              next[index] = {
                                ...range,
                                start_time: e.target.value,
                              };
                              onRangesChange(next);
                            }}
                          />
                        </Field>
                        <Field label="סיום">
                          <Input
                            type="time"
                            value={range.end_time}
                            onChange={(e) => {
                              const next = [...ranges];
                              next[index] = {
                                ...range,
                                end_time: e.target.value,
                              };
                              onRangesChange(next);
                            }}
                          />
                        </Field>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="w-full sm:w-auto"
                          aria-label="הסר טווח"
                          disabled={ranges.length <= 1}
                          onClick={() => onRemoveRange(index)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="cta"
                    disabled={isPending}
                    onClick={onSave}
                  >
                    שמירה לתאריכים שנבחרו
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={onUseWeekly}
                  >
                    חזרה לשעות שבועיות
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">צפייה בלבד.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function mapSaveError(code: string): string {
  const copy: Record<string, string> = {
    invalid_input: "פרטים לא תקינים.",
    forbidden: "אין הרשאה.",
    ranges_overlap: RANGE_ERROR_COPY.overlap,
    invalid_time_order: RANGE_ERROR_COPY.invalid_order,
    empty_ranges: RANGE_ERROR_COPY.empty,
    unknown: "אירעה שגיאה. נסה שוב.",
  };
  return copy[code] ?? copy.unknown!;
}
