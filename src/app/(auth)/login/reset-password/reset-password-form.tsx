"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/server/actions/auth";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "הסיסמה חייבת להכיל לפחות 8 תווים.",
  update_password_failed: "לא הצלחנו לעדכן את הסיסמה. נסה/י שוב.",
  supabase_not_configured: "Supabase לא מוגדר.",
  demo_mode: "מצב הדגמה פעיל.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type ResetPasswordFormProps = {
  nextPath?: string;
  supabaseConfigured?: boolean;
};

export function ResetPasswordForm({
  nextPath,
  supabaseConfigured = true,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }
    if (!supabaseConfigured) {
      setError(ERROR_COPY.supabase_not_configured);
      return;
    }

    startTransition(async () => {
      const result = await updatePassword({ password }, nextPath);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      window.location.assign(result.redirectUrl ?? "/dashboard");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <Field label="סיסמה חדשה" htmlFor="new-password">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Field label="אימות סיסמה" htmlFor="confirm-password">
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || !supabaseConfigured}
      >
        שמירת סיסמה חדשה
        <KeyRound className="size-5" />
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
