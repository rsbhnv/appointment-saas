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
import { isDemoMode } from "@/lib/env/client";
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
  if (user) {
    const target = await resolvePostLoginTarget();
    redirect(params.next && params.next.startsWith("/") ? params.next : target.path);
  }

  return (
    <Card tone="elegant" className="w-full max-w-[440px] border-0 shadow-purple-md">
      <CardHeader className="space-y-1 border-b border-outline-variant/20 pb-6 text-center">
        <CardTitle className="text-xl">התחברות</CardTitle>
        <CardDescription>
          {isDemoMode
            ? "ברוכים השבים — כניסה למצב הדגמה"
            : "ברוכים השבים למערכת ניהול התורים שלכם"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isDemoMode ? (
          <DemoLogin
            credentialedRoles={getDemoCredentialedRoles()}
            quickRoleKeys={[...DEMO_USER_KEYS]}
          />
        ) : (
          <LoginForm initialError={params.error} nextPath={params.next} />
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
