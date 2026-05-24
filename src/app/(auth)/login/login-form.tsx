"use client";

import { useState, useTransition } from "react";
import { LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
} from "@/server/actions/auth";

type Mode = "password" | "magic_link";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים. נסה שוב.",
  invalid_credentials: "אימייל או סיסמה שגויים.",
  magic_link_failed: "לא הצלחנו לשלוח קישור. נסה שוב מאוחר יותר.",
  oauth_failed: "ההתחברות באמצעות גוגל נכשלה. נסה שוב.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type LoginFormProps = {
  initialError?: string;
  nextPath?: string;
};

export function LoginForm({ initialError, nextPath }: LoginFormProps) {
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
    startTransition(async () => {
      if (mode === "password") {
        const result = await signInWithPassword({ email, password });
        if (!result.ok) {
          setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
          return;
        }
        window.location.assign(
          nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard",
        );
        return;
      }
      const result = await signInWithMagicLink({ email });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setInfo("שלחנו קישור התחברות לכתובת האימייל. בדוק את תיבת הדואר.");
    });
  }

  function handleGoogle() {
    reset();
    startTransition(async () => {
      const result = await signInWithGoogle(nextPath);
      if (!result.ok || !result.redirectUrl) {
        setError(
          ERROR_COPY[result.ok ? "unknown" : result.error] ?? ERROR_COPY.unknown,
        );
        return;
      }
      window.location.assign(result.redirectUrl);
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

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {mode === "password" ? "התחבר" : "שלח קישור התחברות"}
          <LogIn className="size-5" />
        </Button>
      </form>

      <div className="relative flex items-center py-1">
        <Separator className="flex-1" />
        <span className="px-4 text-sm text-outline">או באמצעות</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={handleGoogle}
      >
        <GoogleIcon />
        התחברות באמצעות Google
      </Button>

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
