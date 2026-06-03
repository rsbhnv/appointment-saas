import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env/client";
import { isCustomerPortalPath } from "@/lib/tenant/customer-portal-paths";
import { resolvePostLoginTarget } from "@/server/actions/post-login";
import { tryGetSession } from "@/server/guards";

import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = (await searchParams) ?? {};

  if (typeof params.next === "string" && isCustomerPortalPath(params.next)) {
    redirect(params.next);
  }

  if (isDemoMode) {
    redirect("/login");
  }

  const user = await tryGetSession();
  if (user) {
    const target = await resolvePostLoginTarget();
    redirect(
      params.next && params.next.startsWith("/") ? params.next : target.path,
    );
  }

  return (
    <Card tone="elegant" className="w-full max-w-[440px] border-0 shadow-purple-md">
      <CardHeader className="space-y-1 border-b border-outline-variant/20 pb-6 text-center">
        <CardTitle className="text-xl">הרשמה</CardTitle>
        <CardDescription>צור חשבון לניהול העסק שלך</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!isSupabaseConfigured ? (
          <div
            className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs text-amber-900 dark:text-amber-200"
            role="status"
          >
            Supabase לא מוגדר. ראה{" "}
            <Link href="/login" className="font-medium underline">
              התחברות
            </Link>{" "}
            או הפעל{" "}
            <code className="rounded bg-background/80 px-1">
              NEXT_PUBLIC_DEMO_MODE=true
            </code>
            .
          </div>
        ) : null}
        <SignupForm
          nextPath={params.next}
          supabaseConfigured={isSupabaseConfigured}
        />
      </CardContent>
    </Card>
  );
}
