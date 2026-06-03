"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  signInWithMagicLink,
  signInWithPassword,
} from "@/server/actions/auth";

type Mode = "password" | "magic_link";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים. נסה שוב.",
  invalid_credentials: "אימייל או סיסמה שגויים.",
  magic_link_failed: "לא הצלחנו לשלוח קישור. נסה שוב מאוחר יותר.",
  otp_expired: "הקישור פג תוקף. התחברו מחדש כדי לקבל קישור חדש.",
  auth_callback_failed: "קישור ההתחברות פג תוקף או אינו תקין. נסה שוב.",
  supabase_not_configured:
    "Supabase לא מוגדר. הוסף את מפתחות ה-API ל-.env.local והפעל מחדש את השרver.",
  demo_mode: "מצב הדגמה פעיל — השתמש בכפתורי הדמו.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type LoginFormProps = {
  initialError?: string;
  nextPath?: string;
  supabaseConfigured?: boolean;
};

export function LoginForm({
  initialError,
  nextPath,
  supabaseConfigured = true,
}: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError ? (ERROR_COPY[initialError] ?? ERROR_COPY.unknown) : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setInfo(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    if (!supabaseConfigured) {
      setError(ERROR_COPY.supabase_not_configured);
      return;
    }
    startTransition(async () => {
      if (mode === "password") {
        const result = await signInWithPassword({ email, password }, nextPath);
        if (!result.ok) {
          setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
          return;
        }
        window.location.assign(result.redirectUrl ?? "/dashboard");
        return;
      }
      const result = await signInWithMagicLink({ email }, nextPath);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setInfo(
        "שלחנו קישור התחברות לכתובת האימייל. בדוק את תיבת הדואר (כולל ספאם).",
      );
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="כתובת אימייל" htmlFor="email">
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              className="pe-10"
            />
            <Mail className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-outline/50" />
          </div>
        </Field>

        {mode === "password" && (
          <Field label="סיסמה" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="mt-1.5 text-end">
              <Link
                href="/login/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                שכחתי סיסמה
              </Link>
            </p>
          </Field>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-on-surface-variant" role="status">
            {info}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !supabaseConfigured}
        >
          {mode === "password" ? "התחבר" : "שלח קישור התחברות"}
          <LogIn className="size-5" />
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          reset();
          setMode((m) => (m === "password" ? "magic_link" : "password"));
        }}
      >
        {mode === "password"
          ? "התחברות באמצעות קישור באימייל"
          : "התחברות באמצעות סיסמה"}
      </Button>
    </div>
  );
}
