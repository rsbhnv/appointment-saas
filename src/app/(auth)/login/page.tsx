import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDemoCredentialedRoles } from "@/lib/demo/credentials";
import { DEMO_USER_KEYS } from "@/lib/demo/fixtures";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env/client";
import { isCustomerPortalPath } from "@/lib/tenant/customer-portal-paths";
import { resolvePostLoginTarget } from "@/server/actions/post-login";
import { tryGetSession } from "@/server/guards";

import { DemoLogin } from "./demo-login";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const user = await tryGetSession();

  if (!user && typeof params.next === "string" && isCustomerPortalPath(params.next)) {
    redirect(params.next);
  }

  if (user) {
    const target = await resolvePostLoginTarget();
    redirect(
      params.next && params.next.startsWith("/") ? params.next : target.path,
    );
  }

  return (
    <Card tone="elegant" className="w-full max-w-[440px] border-0 shadow-purple-md">
      <CardHeader className="space-y-1 border-b border-outline-variant/20 pb-6 text-center">
        <CardTitle className="text-xl">התחברות</CardTitle>
        <CardDescription>
          {isDemoMode
            ? "ברוכים השבים — כניסה למצב הדגמה"
            : "כניסה ללוח הבקרה — לבעלי עסק וצוות"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isDemoMode ? (
          <DemoLogin
            credentialedRoles={getDemoCredentialedRoles()}
            quickRoleKeys={[...DEMO_USER_KEYS]}
          />
        ) : (
          <>
            {!isSupabaseConfigured ? (
              <div
                className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs text-amber-900 dark:text-amber-200"
                role="status"
              >
                Supabase לא מוגדר. מלא ב-`.env.local` את{" "}
                <code className="rounded bg-background/80 px-1">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                ו-{" "}
                <code className="rounded bg-background/80 px-1">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
                , או הפעל{" "}
                <code className="rounded bg-background/80 px-1">
                  NEXT_PUBLIC_DEMO_MODE=true
                </code>{" "}
                לתצוגה מקומית.
              </div>
            ) : null}
            <LoginForm
              initialError={params.error}
              nextPath={params.next}
              supabaseConfigured={isSupabaseConfigured}
            />
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              אין לך חשבון?{" "}
              <Link
                href={
                  params.next
                    ? `/signup?next=${encodeURIComponent(params.next)}`
                    : "/signup"
                }
                className="font-medium text-primary hover:underline"
              >
                הרשמה
              </Link>
            </p>
          </>
        )}
        <p className="mt-6 text-center text-xs text-on-surface-variant">
          בכניסה אתה מאשר את{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            תנאי השימוש
          </Link>{" "}
          ואת{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
