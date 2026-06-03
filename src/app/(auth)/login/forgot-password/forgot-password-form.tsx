"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/server/actions/auth";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "כתובת אימייל לא תקינה.",
  reset_request_failed: "לא הצלחנו לשלוח קישור איפוס. נסה שוב מאוחר יותר.",
  supabase_not_configured: "Supabase לא מוגדר.",
  demo_mode: "מצב הדגמה פעיל — אין איפוס סיסמה.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type ForgotPasswordFormProps = {
  supabaseConfigured?: boolean;
};

export function ForgotPasswordForm({
  supabaseConfigured = true,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured) {
      setError(ERROR_COPY.supabase_not_configured);
      return;
    }

    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center" dir="rtl">
        <p className="text-sm text-on-surface-variant" role="status">
          אם קיים חשבון עבור <strong dir="ltr">{email}</strong>, שלחנו קישור לאיפוס
          סיסמה. בדוק/י את תיבת הדואר (כולל ספאם).
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          חזרה להתחברות
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <Field label="כתובת אימייל" htmlFor="reset-email">
        <div className="relative">
          <Input
            id="reset-email"
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
        שליחת קישור איפוס
        <Send className="size-5" />
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
