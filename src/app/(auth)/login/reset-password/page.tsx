import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env/client";
import { tryGetSession } from "@/server/guards";

import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  if (isDemoMode) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const user = await tryGetSession();

  if (!user) {
    redirect(
      params.error
        ? `/login/forgot-password?error=${encodeURIComponent(params.error)}`
        : "/login/forgot-password",
    );
  }

  return (
    <Card tone="elegant" className="w-full max-w-[440px] border-0 shadow-purple-md">
      <CardHeader className="space-y-1 border-b border-outline-variant/20 pb-6 text-center">
        <CardTitle className="text-xl">סיסמה חדשה</CardTitle>
        <CardDescription>בחר/י סיסמה חדשה לחשבון {user.email}.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ResetPasswordForm
          nextPath={params.next}
          supabaseConfigured={isSupabaseConfigured}
        />
      </CardContent>
    </Card>
  );
}
