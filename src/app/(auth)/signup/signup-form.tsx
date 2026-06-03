"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpWithPassword } from "@/server/actions/auth";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים. הסיסמה חייבת להיות לפחות 8 תווים.",
  email_already_registered: "כתובת האימייל כבר רשומה. נסה להתחבר.",
  signup_failed: "לא הצלחנו ליצור חשבון. נסה שוב מאוחר יותר.",
  supabase_not_configured:
    "Supabase לא מוגדר. הוסף את מפתחות ה-API ל-.env.local והפעל מחדש את השרver.",
  demo_mode: "מצב הדגמה פעיל — הרשמה אינה זמינה.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type SignupFormProps = {
  nextPath?: string;
  supabaseConfigured?: boolean;
};

export function SignupForm({
  nextPath,
  supabaseConfigured = true,
}: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!supabaseConfigured) {
      setError(ERROR_COPY.supabase_not_configured);
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }

    startTransition(async () => {
      const result = await signUpWithPassword({ email, password }, nextPath);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      if (result.needsEmailConfirmation) {
        setInfo(
          "נרשמת בהצלחה. אשר את כתובת האימייל מההודעה ששלחנו, ואז התחבר.",
        );
        return;
      }
      window.location.assign(result.redirectUrl ?? "/dashboard");
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="כתובת אימייל" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@business.com"
          />
        </Field>

        <Field label="סיסמה" htmlFor="signup-password">
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="לפחות 8 תווים"
          />
        </Field>

        <Field label="אימות סיסמה" htmlFor="signup-confirm">
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isPending}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="הקלד שוב את הסיסמה"
          />
        </Field>

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
          צור חשבון
          <UserPlus className="size-5" />
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        כבר יש לך חשבון?{" "}
        <Link
          href={
            nextPath
              ? `/login?next=${encodeURIComponent(nextPath)}`
              : "/login"
          }
          className="font-medium text-primary hover:underline"
        >
          התחברות
        </Link>
      </p>
    </div>
  );
}
