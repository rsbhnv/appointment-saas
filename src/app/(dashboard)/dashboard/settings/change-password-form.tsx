"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";

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
import { changePasswordAction } from "@/server/actions/auth";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "הסיסמה החדשה חייבת להכיל לפחות 8 תווים.",
  invalid_current_password: "הסיסמה הנוכחית שגויה.",
  same_password: "הסיסמה החדשה חייבת להיות שונה מהנוכחית.",
  update_password_failed: "לא הצלחנו לעדכן את הסיסמה. נסה/י שוב.",
  supabase_not_configured: "Supabase לא מוגדר.",
  demo_mode: "מצב הדגמה — שינוי סיסמה לא זמין.",
  unauthenticated: "יש להתחבר מחדש.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type ChangePasswordFormProps = {
  userEmail: string | null;
};

export function ChangePasswordForm({ userEmail }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("הסיסמאות החדשות אינן תואמות.");
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("הסיסמה עודכנה בהצלחה.");
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" aria-hidden />
          שינוי סיסמה
        </CardTitle>
        <CardDescription>
          {userEmail
            ? `עדכון סיסמת החשבון ${userEmail}`
            : "עדכון סיסמת החשבון המחובר"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-md gap-4 pt-6">
        <Field label="סיסמה נוכחית" htmlFor="current-password">
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            disabled={isPending}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="סיסמה חדשה" htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            disabled={isPending}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="לפחות 8 תווים"
          />
        </Field>
        <Field label="אימות סיסמה חדשה" htmlFor="confirm-new-password">
          <Input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            disabled={isPending}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-primary" role="status">
            {success}
          </p>
        ) : null}
        <div>
          <Button
            type="button"
            disabled={
              isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            onClick={submit}
          >
            {isPending ? "שומר..." : "עדכון סיסמה"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
