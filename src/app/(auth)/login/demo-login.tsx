"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DEMO_USERS, type DemoUserKey } from "@/lib/demo/fixtures";
import {
  signInAsDemoUser,
  signInWithDemoPassword,
} from "@/server/actions/demo-auth";

const ROLE_DESCRIPTIONS: Record<DemoUserKey, string> = {
  super_admin: "גישה לקונסולת הפלטפורמה (super-admin).",
  business_owner: "ניהול עסק לדוגמה — Demo Studio.",
  staff: "תצוגת לוח בקרה ברמת איש צוות.",
};

export type DemoCredentialedRole = {
  key: DemoUserKey;
  phone: string;
  displayName: string;
};

type DemoLoginProps = {
  /** Roles with phone+password configured via .env.local. */
  credentialedRoles: DemoCredentialedRole[];
  /** All demo role keys to show as quick-access buttons. */
  quickRoleKeys: DemoUserKey[];
};

export function DemoLogin({ credentialedRoles, quickRoleKeys }: DemoLoginProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
        מצב הדגמה פעיל — נתונים מקומיים בלבד, אין חיבור ל-Supabase.
      </div>

      {credentialedRoles.length > 0 ? (
        <PasswordForm roles={credentialedRoles} />
      ) : null}

      <QuickButtons
        keys={quickRoleKeys}
        showDivider={credentialedRoles.length > 0}
      />
    </div>
  );
}

function PasswordForm({ roles }: { roles: DemoCredentialedRole[] }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInWithDemoPassword({ phone, password });
      if (!result.ok) {
        setError(
          result.error === "invalid_credentials"
            ? "מספר טלפון או סיסמה שגויים."
            : "אירעה שגיאה. נסי שוב.",
        );
        return;
      }
      window.location.assign(result.redirectUrl);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <Field label="טלפון" htmlFor="demo-phone">
        <Input
          id="demo-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="050-0000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={pending}
        />
      </Field>
      <Field label="סיסמה" htmlFor="demo-password">
        <Input
          id="demo-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="cta"
        className="w-full"
        disabled={pending || !phone || !password}
      >
        {pending ? "מתחבר…" : "כניסה"}
      </Button>
      <details className="rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none font-medium">
          חשבונות הדגמה זמינים
        </summary>
        <ul className="mt-2 space-y-1">
          {roles.map((role) => (
            <li key={role.key} className="flex items-center justify-between gap-2">
              <span>{role.displayName}</span>
              <code className="rounded bg-background px-1.5 py-0.5">
                {role.phone}
              </code>
            </li>
          ))}
        </ul>
      </details>
    </form>
  );
}

function QuickButtons({
  keys,
  showDivider,
}: {
  keys: DemoUserKey[];
  showDivider: boolean;
}) {
  const [pendingKey, setPendingKey] = useState<DemoUserKey | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function chooseRole(key: DemoUserKey) {
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      const result = await signInAsDemoUser(key);
      if (!result.ok) {
        setError("ההתחברות נכשלה. נסי שוב.");
        setPendingKey(null);
        return;
      }
      window.location.assign(result.redirectUrl);
    });
  }

  return (
    <div className="space-y-2">
      {showDivider ? (
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
          כניסה מהירה
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>
      ) : null}
      <ul className="space-y-2">
        {keys.map((key) => {
          const user = DEMO_USERS[key];
          const description = ROLE_DESCRIPTIONS[key];
          const isPendingHere = pending && pendingKey === key;
          return (
            <li key={key}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-auto w-full justify-start gap-3 px-4 py-3 text-start"
                onClick={() => chooseRole(key)}
                disabled={pending}
                aria-busy={isPendingHere || undefined}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{user.displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
