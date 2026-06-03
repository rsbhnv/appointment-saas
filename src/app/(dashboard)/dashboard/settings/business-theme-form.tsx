"use client";

import { useMemo, useState, useTransition, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { THEME_PRESET_LIST, isBusinessThemeStyle } from "@/lib/theme/presets";
import { resolveBusinessTheme } from "@/lib/theme/resolve-theme";
import type { BusinessThemeStyle } from "@/lib/theme/types";
import { updateBusinessThemeAction } from "@/server/actions/settings";
import type { Business } from "@/server/repositories/businesses";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטי עיצוב לא תקינים.",
  forbidden: "רק בעל העסק יכול לעדכן עיצוב.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type BusinessThemeFormProps = {
  business: Business;
  canEdit: boolean;
};

export function BusinessThemeForm({ business, canEdit }: BusinessThemeFormProps) {
  const [themeStyle, setThemeStyle] = useState(business.theme_style ?? "");
  const [primaryColor, setPrimaryColor] = useState(business.primary_color ?? "");
  const [secondaryColor, setSecondaryColor] = useState(business.secondary_color ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(
    () =>
      resolveBusinessTheme({
        theme_style: themeStyle || null,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
      }),
    [themeStyle, primaryColor, secondaryColor],
  );

  function applyPreset(style: BusinessThemeStyle) {
    const preset = THEME_PRESET_LIST.find((row) => row.id === style);
    if (!preset) return;
    setThemeStyle(style);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  }

  function saveTheme() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateBusinessThemeAction({
        theme_style: themeStyle || null,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setMessage("עיצוב העסק נשמר.");
    });
  }

  function resetTheme() {
    setThemeStyle("");
    setPrimaryColor("");
    setSecondaryColor("");
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>עיצוב ומיתוג</CardTitle>
        <CardDescription>
          צבעי המותג מוצגים בדף ההזמנה ללקוחות ובלוח הבקרה. ללא בחירה — עיצוב ברירת
          המחדל של הפלטפורמה.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <Field label="סגנון עיצוב" htmlFor="theme-style">
          <select
            id="theme-style"
            className="flex h-12 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm"
            value={themeStyle}
            disabled={!canEdit}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setThemeStyle("");
                return;
              }
              if (isBusinessThemeStyle(value)) {
                applyPreset(value);
              }
            }}
          >
            <option value="">ברירת מחדל (SaaS)</option>
            {THEME_PRESET_LIST.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.labelHe}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="צבע ראשי" htmlFor="theme-primary">
            <div className="flex items-center gap-3">
              <input
                id="theme-primary"
                type="color"
                value={primaryColor || "#5230cd"}
                disabled={!canEdit}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="size-12 shrink-0 cursor-pointer rounded-lg border border-outline-variant/30 bg-transparent p-1"
                aria-label="בחירת צבע ראשי"
              />
              <input
                type="text"
                value={primaryColor}
                disabled={!canEdit}
                placeholder="#5230CD"
                dir="ltr"
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex h-12 min-w-0 flex-1 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm"
              />
            </div>
          </Field>
          <Field label="צבע משני" htmlFor="theme-secondary">
            <div className="flex items-center gap-3">
              <input
                id="theme-secondary"
                type="color"
                value={secondaryColor || "#6b4ee6"}
                disabled={!canEdit}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="size-12 shrink-0 cursor-pointer rounded-lg border border-outline-variant/30 bg-transparent p-1"
                aria-label="בחירת צבע משני"
              />
              <input
                type="text"
                value={secondaryColor}
                disabled={!canEdit}
                placeholder="#6B4EE6"
                dir="ltr"
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex h-12 min-w-0 flex-1 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm"
              />
            </div>
          </Field>
        </div>

        {preview ? (
          <div
            className="rounded-xl border border-outline-variant/25 p-4"
            style={preview.cssVars as CSSProperties}
          >
            <p className="mb-3 text-sm font-medium text-on-surface">תצוגה מקדימה</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                כפתור ראשי
              </span>
              <span className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                קישור / הדגשה
              </span>
              <span className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                משני
              </span>
              <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">
                תגית
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            לא נבחר עיצוב מותאם — יוצג עיצוב ברירת המחדל של הפלטפורמה.
          </p>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-primary" role="status">
            {message}
          </p>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={isPending} onClick={saveTheme}>
              שמירת עיצוב
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={resetTheme}>
              איפוס לברירת מחדל
            </Button>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">רק בעל העסק יכול לערוך עיצוב.</p>
        )}
      </CardContent>
    </Card>
  );
}
